import React from "react";

const IconDoctor = (
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
      src="/nurse.png"
      alt="doctor"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconDoctor };
