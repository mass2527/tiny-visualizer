import { ReactNode } from "react";

function Fieldset({
  legend,
  children,
}: {
  legend: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

export default Fieldset;
