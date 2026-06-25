interface MercosulPlateProps {
  plate: string;
}

export function MercosulPlate({ plate }: MercosulPlateProps) {
  return (
    <div className="inline-flex flex-col items-center border-[1.5px] border-gray-300 rounded-sm overflow-hidden bg-white shadow-sm w-fit group hover:border-blue-400 transition-colors">
      <div className="bg-[#003399] w-full px-4 py-0.5 flex items-center justify-between gap-4">
        <span className="text-[6px] font-bold text-white tracking-widest uppercase">Brasil</span>
        <div className="flex items-center gap-1">
          <div className="w-2 h-1.5 bg-[#009b3a] relative overflow-hidden flex items-center justify-center">
            <div className="w-1 h-1 bg-[#fedf00] rotate-45" />
            <div className="w-0.5 h-0.5 bg-[#002776] rounded-full absolute" />
          </div>
        </div>
      </div>
      <div className="px-3 py-0.5 bg-white">
        <span className="text-sm font-bold text-gray-900 tracking-tight font-mono uppercase">
          {plate.replace("-", "")}
        </span>
      </div>
    </div>
  );
}
