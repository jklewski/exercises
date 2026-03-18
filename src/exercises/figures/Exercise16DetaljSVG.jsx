/**
 * Exercise16DetaljSVG – oblique detail of roof plate / gable beam connection.
 * Static figure based on user-supplied SVG drawing.
 */
export default function Exercise16DetaljSVG() {
  return (
    <svg
      viewBox="36.036546 207.05327 118.95767 77.440651"
      width={260}
      style={{ display: 'block', fontFamily: 'sans-serif', fontSize: 10 }}
    >
      <defs>
        <marker id="det-tri" refX="0" refY="0" orient="auto-start-reverse"
          markerWidth="2" markerHeight="2" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid">
          <path transform="scale(0.5)" fill="#000000" fillRule="evenodd"
            stroke="#000000" strokeWidth="1pt"
            d="M 5.77,0 -2.88,5 V -5 Z" />
        </marker>
      </defs>

      {/* Outer plate edges */}
      <path fill="none" stroke="#000000" strokeWidth={0.7}
        d="m 36.648396,270.22937 c 0.735656,-0.18402 117.520954,-7.72863 117.520954,-7.72863" />
      <path fill="none" stroke="#000000" strokeWidth={0.7}
        d="M 36.624541,266.36506 154.17091,259.38344" />

      {/* Inner plate edges */}
      <path fill="none" stroke="#000000" strokeWidth={0.7}
        d="m 36.772935,245.88092 c 0.732552,-0.18403 117.024985,-7.72863 117.024985,-7.72863" />
      <path fill="none" stroke="#000000" strokeWidth={0.7}
        d="M 36.956648,242.0166 154.43988,235.03499" />

      {/* Beam band dashed edges */}
      <path fill="none" stroke="#000000" strokeWidth={0.7} strokeDasharray="2.80001,0.7"
        d="m 36.852563,242.01888 c 0.73606,-0.18403 117.585487,-7.72863 117.585487,-7.72863" />
      <path fill="none" stroke="#000000" strokeWidth={0.7} strokeDasharray="2.80001,0.7"
        d="M 37.036578,235.50871 154.51981,228.5271" />

      {/* Purlins – left */}
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 47.697766,256.93358 6.750036,-0.40113" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 51.072784,256.73301 -0.985757,-15.44782 3.385516,-0.22912" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 50.087027,241.28519 -3.492567,0.24104" />

      {/* Purlins – middle */}
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 89.304118,254.77834 6.75004,-0.40113" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 92.679138,254.57777 -0.985758,-15.44782 3.385518,-0.22912" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 91.164195,239.12998 -3.492567,0.24104" />

      {/* Purlins – right */}
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 127.86655,252.43561 6.75004,-0.40113" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 131.24157,252.23504 -0.98576,-15.44782 3.38552,-0.22912" />
      <path fill="none" stroke="#000000" strokeWidth={1}
        d="m 129.72663,236.78725 -3.49257,0.24104" />

      {/* Chain-dash centre lines (gable ends) */}
      <path fill="none" stroke="#000000" strokeWidth={0.7} strokeDasharray="5.6,1.4,0.7,1.4"
        d="m 36.953455,226.24981 c 0,0.92008 0,57.78067 0,57.78067" />
      <path fill="none" stroke="#000000" strokeWidth={0.7} strokeDasharray="5.6,1.4,0.7,1.4"
        d="M 154.17092,222.75353 V 275.5658" />

      {/* Roof plate fill (light gray) */}
      <path fill="#000000" fillOpacity={0.26} stroke="none"
        d="m 36.648398,270.22937 0.30825,-28.21277 117.483232,-6.98161 -0.27053,27.46575 z" />

      {/* Gable beam cross-section fill (darker gray) */}
      <path fill="#000000" fillOpacity={0.567} stroke="#000000" strokeWidth={1}
        d="m 36.852564,242.01888 0.184015,-6.51017 117.483231,-6.98161 -0.0818,5.76315 z" />

      {/* Screws (red dashed) */}
      {[
        "m 45.736357,238.99755 0.596463,10.68286",
        "m 58.248029,237.80565 0.596463,10.68286",
        "m 70.112349,236.81249 0.596463,10.68286",
        "m 82.206931,235.88597 0.596463,10.68286",
        "m 94.419697,235.06286 0.596463,10.68286",
        "m 106.28402,234.71348 0.59646,10.68286",
        "m 117.39497,233.96885 0.59646,10.68286",
        "m 127.42489,233.44808 0.59647,10.68286",
        "m 137.45576,233.32429 0.59647,10.68286",
        "m 148.43909,232.67829 0.59646,10.68286",
      ].map((d, i) => (
        <path key={i} fill="none" stroke="#cc0000" strokeWidth={1} strokeDasharray="2,1" d={d} />
      ))}

      {/* Takplåt leader with arrowhead */}
      <path fill="none" stroke="#000000" strokeWidth={0.4}
        markerStart="url(#det-tri)"
        d="m 141.90715,226.4615 -3.11782,-13.85885 h -6.30197" />

      {/* Labels */}
      <text fill="#374151" x="103.05651" y="214.29602">Takplåt</text>
      <text fill="#374151" x="47.328983" y="219.93613">s-avstånd</text>

      {/* s-avstånd dimension lines */}
      <path fill="none" stroke="#001300" strokeWidth={0.5}
        d="m 53.791016,227.48703 19.843675,-1.05388" />
      <path fill="none" stroke="#001300" strokeWidth={0.5}
        d="m 58.15583,232.30137 -0.547461,-8.76461" />
      <path fill="none" stroke="#001300" strokeWidth={0.5}
        d="m 69.860923,231.95208 -0.32849,-9.48846" />
      <path fill="none" stroke="#001300" strokeWidth={0.5}
        d="m 59.657731,225.03868 c -0.845769,0.81324 -3.643309,4.65172 -3.643309,4.65172" />
      <path fill="none" stroke="#001300" strokeWidth={0.5}
        d="m 71.869149,224.15124 c -0.845769,0.81324 -3.643309,4.65172 -3.643309,4.65172" />
    </svg>
  )
}
