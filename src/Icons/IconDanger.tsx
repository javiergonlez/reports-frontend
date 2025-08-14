import React from "react";

const IconDanger = (
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
      src="/danger.png"
      alt="peligro"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconDanger };