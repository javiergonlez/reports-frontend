import React from "react";

const IconSpreadsheet2 = (
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
      src="/tasks-details.png"
      alt="hoja"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconSpreadsheet2 };


