export const NatanjouLogo = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 200 50"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Orange/citrus circle */}
      <circle cx="25" cy="25" r="20" fill="#E07A5F" />
      <circle cx="25" cy="25" r="16" fill="#F2A65A" />
      {/* Orange segments */}
      <path
        d="M25 9 L25 41 M13 17 L37 33 M13 33 L37 17"
        stroke="#E07A5F"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Leaf */}
      <ellipse
        cx="38"
        cy="10"
        rx="6"
        ry="4"
        fill="#81B29A"
        transform="rotate(-30 38 10)"
      />
      <path
        d="M32 14 Q35 10 40 8"
        stroke="#81B29A"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Text "Natanjou" */}
      <text
        x="55"
        y="33"
        fontFamily="'Fraunces', Georgia, serif"
        fontSize="26"
        fontWeight="700"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        Natanjou
      </text>
    </svg>
  );
};

export default NatanjouLogo;
