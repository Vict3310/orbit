import type { CrewState, SimulationState, ZoneId } from '../../types/domain';
import { ASTRONAUT_BY_ID } from '../../data/astronauts';
import { ZONES } from '../../engines/simulation/config';
import { doseRateFor } from '../../engines/simulation/healthModel';
import { cn } from '../ui';

const GEOMETRY: Record<ZoneId, { x: number; y: number; w: number; h: number }> = {
  quarters: { x: 56, y: 68, w: 220, h: 164 },
  medbay: { x: 292, y: 68, w: 190, h: 164 },
  lab: { x: 498, y: 68, w: 204, h: 164 },
  solar: { x: 718, y: 68, w: 158, h: 164 },
  exercise: { x: 56, y: 304, w: 196, h: 152 },
  shelter: { x: 268, y: 304, w: 196, h: 152 },
  'life-support': { x: 480, y: 304, w: 196, h: 152 },
  eva: { x: 692, y: 292, w: 184, h: 232 },
};

const ZONE_ORDER: ZoneId[] = [
  'quarters',
  'medbay',
  'exercise',
  'shelter',
  'lab',
  'solar',
  'life-support',
  'eva',
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2);
}

function Module({
  zone,
  sim,
  selected,
  onSelect,
  occupants,
}: {
  zone: ZoneId;
  sim: SimulationState;
  selected: boolean;
  onSelect: (zone: ZoneId) => void;
  occupants: CrewState[];
}) {
  const geometry = GEOMETRY[zone];
  const definition = ZONES[zone];
  const dose = doseRateFor(zone, sim.env);
  const critical = zone === 'life-support' && sim.env.eclssStatus !== 'nominal';
  const shelterAlert = zone === 'shelter' && sim.env.spe?.active;
  const { x, y, w, h } = geometry;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`${definition.label}. ${occupants.length} crew present. Simulated dose rate ${dose.toFixed(2)} millisievert per day. Select to inspect.`}
      onClick={() => onSelect(zone)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(zone);
        }
      }}
      className="group cursor-pointer outline-none"
    >
      <title>{definition.label}</title>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#101923"
        stroke={selected ? '#D9F26A' : critical || shelterAlert ? '#F2BA68' : '#293744'}
        strokeWidth={selected ? 1.6 : 1}
        className={selected ? undefined : 'group-hover:stroke-[#4a6075]'}
      />
      {zone === 'shelter' && (
        <rect x={x + 1} y={y + 1} width={w - 2} height={h - 2} fill="url(#hatch)" opacity={0.55} />
      )}
      {zone === 'eva' && (
        <>
          <path
            d={`M${x + 8} ${y + 86} Q${x + w / 2} ${y + 74} ${x + w - 8} ${y + 92}`}
            fill="none"
            stroke="#293744"
            strokeDasharray="3 4"
          />
          <ellipse cx={x + w - 46} cy={y + 132} rx="24" ry="9" fill="none" stroke="#293744" />
          <ellipse cx={x + 54} cy={y + 166} rx="16" ry="6" fill="none" stroke="#293744" />
          <text
            x={x + 10}
            y={y + h - 12}
            fill="#94A5B5"
            fontSize="8"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="1"
          >
            LUNAR SURFACE · 1/6 g
          </text>
        </>
      )}
      {zone === 'solar' && (
        <g stroke="#3b4d5f" strokeWidth="1">
          {[0, 1, 2].map((index) => (
            <rect
              key={index}
              x={x + 18 + index * 42}
              y={y + 74}
              width={32}
              height={54}
              fill="#141e29"
            />
          ))}
          {[0, 1, 2].map((index) => (
            <g key={index}>
              <line x1={x + 18 + index * 42} y1={y + 92} x2={x + 50 + index * 42} y2={y + 92} />
              <line x1={x + 18 + index * 42} y1={y + 110} x2={x + 50 + index * 42} y2={y + 110} />
            </g>
          ))}
        </g>
      )}
      {zone === 'medbay' && (
        <g stroke="#3b4d5f" strokeWidth="1" fill="none">
          <path d={`M${x + 22} ${y + 92}h12M${x + 28} ${y + 86}v12`} stroke="#65D6A5" />
          <rect x={x + 48} y={y + 82} width={54} height={20} fill="#141e29" />
          <line x1={x + 52} y1={y + 96} x2={x + 96} y2={y + 96} stroke="#65D6A5" strokeOpacity="0.5" />
        </g>
      )}
      {zone === 'life-support' && (
        <g>
          {['CO₂', 'O₂', 'TCS'].map((label, index) => (
            <g key={label}>
              <rect
                x={x + 18 + index * 58}
                y={y + 82}
                width={48}
                height={30}
                fill="#141e29"
                stroke="#3b4d5f"
              />
              <text
                x={x + 42 + index * 58}
                y={y + 101}
                textAnchor="middle"
                fill="#94A5B5"
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
              >
                {label}
              </text>
            </g>
          ))}
        </g>
      )}
      {zone === 'lab' && (
        <g stroke="#3b4d5f" strokeWidth="1">
          <rect x={x + 18} y={y + 84} width={54} height={36} fill="#141e29" />
          {[0, 1, 2].map((index) => (
            <line
              key={index}
              x1={x + 24 + index * 14}
              y1={y + 90}
              x2={x + 24 + index * 14}
              y2={y + 114}
              stroke="#65D6A5"
              strokeOpacity={0.5}
            />
          ))}
        </g>
      )}
      {zone === 'exercise' && (
        <g stroke="#3b4d5f" strokeWidth="1" fill="none">
          <rect x={x + 18} y={y + 88} width={58} height={24} fill="#141e29" />
          <line x1={x + 22} y1={y + 98} x2={x + 72} y2={y + 98} stroke="#D9F26A" strokeOpacity="0.55" />
          <circle cx={x + 96} cy={y + 100} r={10} />
        </g>
      )}
      {zone === 'quarters' && (
        <g stroke="#3b4d5f" strokeWidth="1" fill="none">
          {[0, 1, 2].map((index) => (
            <rect key={index} x={x + 18 + index * 54} y={y + 86} width={44} height={26} fill="#141e29" />
          ))}
        </g>
      )}

      <text
        x={x + 12}
        y={y + 19}
        fill={selected ? '#D9F26A' : '#94A5B5'}
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="1.4"
      >
        {definition.short}
        {critical ? ' · FAULT' : ''}
      </text>
      <text
        x={x + 12}
        y={y + 38}
        fill="#F4F7FA"
        fontSize="13"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="500"
      >
        {definition.label}
      </text>
      <text
        x={x + 12}
        y={y + h - 12}
        fill="#94A5B5"
        fontSize="8"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="0.6"
      >
        RAD {dose.toFixed(2)} mSv/d
      </text>

      {occupants.map((crew, index) => {
        const profile = ASTRONAUT_BY_ID[crew.astronautId];
        const cx = x + w - 16 - index * 16;
        const cy = y + h - 18;
        return (
          <g key={crew.astronautId}>
            <title>{profile?.name ?? crew.astronautId}</title>
            <circle cx={cx} cy={cy} r="6" fill={profile?.avatar.patch ?? '#D9F26A'} stroke="#080D13" strokeWidth="1.5" />
            <text
              x={cx}
              y={cy + 2.4}
              textAnchor="middle"
              fill="#080D13"
              fontSize="6"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              {initials(profile?.name ?? 'CR')}
            </text>
          </g>
        );
      })}

      {selected && (
        <g stroke="#D9F26A" strokeWidth="1.4" fill="none" aria-hidden="true">
          <path d={`M${x - 3} ${y + 9}V${y - 3}h12`} />
          <path d={`M${x + w - 9} ${y - 3}h12v12`} />
          <path d={`M${x + w + 3} ${y + h - 9}v12h-12`} />
          <path d={`M${x + 9} ${y + h + 3}h-12v-12`} />
        </g>
      )}
      {shelterAlert && (
        <circle
          cx={x + w - 24}
          cy={y + 24}
          r="4"
          fill="#F2BA68"
          className="animate-pulse-soft"
        />
      )}
    </g>
  );
}

export function HabitatMap({
  sim,
  selectedZone,
  onSelectZone,
}: {
  sim: SimulationState;
  selectedZone: ZoneId;
  onSelectZone: (zone: ZoneId) => void;
}) {
  const occupants = useMemoOccupants(sim);
  const speActive = Boolean(sim.env.spe?.active);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox="0 0 920 560"
        className="w-full min-w-[660px]"
        role="group"
        aria-label="Interactive schematic of the Selene-4 lunar outpost. Select a module to inspect conditions and move crew."
      >
        <defs>
          <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="7" stroke="#293744" strokeWidth="1" />
          </pattern>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#293744" strokeWidth="0.5" opacity="0.32" />
          </pattern>
          <clipPath id="hull">
            <rect x="20" y="20" width="880" height="520" />
          </clipPath>
        </defs>

        <rect width="920" height="560" fill="#0B1119" />
        <rect x="20" y="20" width="880" height="520" fill="#0B1119" stroke="#293744" />
        <rect x="20" y="20" width="880" height="520" fill="url(#grid)" clipPath="url(#hull)" />

        <path d="M4 8h10M8 4v10M906 552h10M912 546v10" stroke="#3b4d5f" />
        <text x="36" y="44" fill="#94A5B5" fontSize="8" fontFamily="JetBrains Mono, monospace" letterSpacing="1.6">
          SELENE-4 · HABITAT SCHEMATIC · SIMULATED
        </text>
        <text x="884" y="44" textAnchor="end" fill="#94A5B5" fontSize="8" fontFamily="JetBrains Mono, monospace">
          {speActive ? 'SPE ACTIVE' : 'ENV NOMINAL'}
        </text>

        {/* Connecting pressurized corridor */}
        <rect x="56" y="250" width="620" height="36" fill="#0E1620" stroke="#293744" />
        <line x1="70" y1="268" x2="662" y2="268" stroke="#293744" strokeDasharray="8 6" />
        {[84, 180, 300, 420, 540, 620].map((cx) => (
          <circle key={cx} cx={cx} cy={268} r="2" fill="#3b4d5f" />
        ))}
        <rect x="676" y="356" width="24" height="30" fill="#0E1620" stroke="#293744" />
        <text x="688" y="352" textAnchor="middle" fill="#94A5B5" fontSize="7" fontFamily="JetBrains Mono, monospace">
          AIRLOCK
        </text>

        {ZONE_ORDER.map((zone) => (
          <Module
            key={zone}
            zone={zone}
            sim={sim}
            selected={selectedZone === zone}
            onSelect={onSelectZone}
            occupants={occupants[zone]}
          />
        ))}

        <g fill="#94A5B5" fontSize="8" fontFamily="JetBrains Mono, monospace">
          <text x="56" y="506">● CREW POSITION</text>
          <text x="190" y="506">▨ SHIELDED HATCH</text>
          <text x="340" y="506">⌁ PRESSURIZED LINK</text>
          <text x="512" y="506">✕ ENVIRONMENTAL FAULT</text>
          <text x="720" y="506" fill={speActive ? '#F2BA68' : '#94A5B5'}>
            {speActive ? 'SPE-04 · SHELTER RECOMMENDED' : 'EXTERNAL DOSE MONITORING ON'}
          </text>
        </g>
        <g stroke="#3b4d5f" fill="none">
          <path d="M836 476v-16m0 0-4 5m4-5 4 5M836 476h1" />
          <text x="832" y="496" textAnchor="middle" fill="#94A5B5" fontSize="7" fontFamily="JetBrains Mono, monospace">
            N
          </text>
        </g>
        <g>
          <line x1="56" y1="524" x2="136" y2="524" stroke="#3b4d5f" />
          <line x1="56" y1="520" x2="56" y2="528" stroke="#3b4d5f" />
          <line x1="136" y1="520" x2="136" y2="528" stroke="#3b4d5f" />
          <text x="96" y="538" textAnchor="middle" fill="#94A5B5" fontSize="7" fontFamily="JetBrains Mono, monospace">
            10 m
          </text>
        </g>
        <text x="864" y="538" textAnchor="end" fill="#94A5B5" fontSize="7" fontFamily="JetBrains Mono, monospace">
          P 101.3 kPa · T {sim.env.tempC.toFixed(1)} °C · O₂ {sim.env.o2.toFixed(1)}%
        </text>
      </svg>
    </div>
  );
}

function useMemoOccupants(sim: SimulationState): Record<ZoneId, CrewState[]> {
  const map = {
    quarters: [],
    medbay: [],
    exercise: [],
    shelter: [],
    lab: [],
    solar: [],
    'life-support': [],
    eva: [],
  } as Record<ZoneId, CrewState[]>;
  for (const id of sim.crewOrder) {
    const crew = sim.crew[id];
    if (crew) map[crew.location].push(crew);
  }
  return map;
}

export function ZoneSelector({
  sim,
  selectedZone,
  onSelectZone,
}: {
  sim: SimulationState;
  selectedZone: ZoneId;
  onSelectZone: (zone: ZoneId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Habitat module selector">
      {ZONE_ORDER.map((zone) => {
        const definition = ZONES[zone];
        const count = sim.crewOrder.filter((id) => sim.crew[id]?.location === zone).length;
        return (
          <button
            key={zone}
            type="button"
            onClick={() => onSelectZone(zone)}
            aria-pressed={selectedZone === zone}
            className={cn(
              'inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.04em]',
              selectedZone === zone
                ? 'border-accent/60 bg-accent/10 text-accent'
                : 'border-line bg-bg text-muted hover:text-ink',
            )}
          >
            {definition.short}
            {count > 0 && <span className="text-ink">· {count}</span>}
          </button>
        );
      })}
    </div>
  );
}
