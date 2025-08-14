import React from "react";

const IconATSA = (
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
      src="/atsa.jpeg"
      alt="atsa"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconATSA };