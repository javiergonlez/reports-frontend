import React from "react";

const IconMedicine = (
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
      src="/medicine.png"
      alt="medicina"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconMedicine };