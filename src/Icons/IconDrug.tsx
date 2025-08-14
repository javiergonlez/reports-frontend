import React from "react";

const IconDrug = (
  props: React.ImgHTMLAttributes<HTMLImageElement>
) => {
  const defaultStyle: React.CSSProperties = {
    display: "block",
    borderWidth: "1px",
    height: "3rem",
    ...props.style,
  };
  return (
    <img
      src="/drug.png"
      alt="atsa"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconDrug };