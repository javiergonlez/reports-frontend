import React from "react";

const IconIncrease = (
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
      src="/increase.png"
      alt="Incrementar"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconIncrease };