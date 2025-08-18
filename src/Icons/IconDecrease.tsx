import React from "react";

const IconDecrease = (
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
      src="/decrease.png"
      alt="Decrementar"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconDecrease };