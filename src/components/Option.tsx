import { ReactNode } from "react";

function Option({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export default Option;
