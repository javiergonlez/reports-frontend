import React from "react";

const IconPeople = (
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
      src="/people.png"
      alt="personas"
      {...props}
      style={defaultStyle}
    />
  );
};

export { IconPeople };