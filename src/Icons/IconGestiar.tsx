import React from "react";

const IconGestiar = (
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
      src="/logo.png"
      alt="gestiar"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconGestiar };
