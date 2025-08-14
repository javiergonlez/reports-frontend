import React from "react";

const IconError = (
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
      src="/error.png"
      alt="error"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconError };
