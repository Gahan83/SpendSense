export default function Icon({ name, size = 20, color, weight = 400, className = '', style = {} }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        color,
        lineHeight: 1,
        fontVariationSettings: `'wght' ${weight}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}
