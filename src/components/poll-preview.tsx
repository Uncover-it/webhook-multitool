interface PollPreviewProps {
  question: string;
  answers: { text: string; emoji?: string }[];
  allowMultiselect: boolean;
  duration: number;
}

export function PollPreview({
  question,
  answers,
  allowMultiselect,
}: PollPreviewProps) {
  return (
    <div className="bg-[#2f3136] rounded-md overflow-hidden max-w-139 p-4 mt-2 border border-[#202225]">
      <h3 className="text-base font-bold text-white mb-4 wrap-break-words">
        {question || "Poll Question"}
      </h3>

      <div className="space-y-2">
        {answers.map((answer, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 bg-[#202225] rounded-md border border-transparent hover:border-gray-600 transition-colors"
          >
            {allowMultiselect ? (
              <div className="w-5 h-5 border-2 border-[#b9bbbe] rounded-[4px]" />
            ) : (
              <div className="w-5 h-5 border-2 border-[#b9bbbe] rounded-full" />
            )}
            <span className="text-sm text-gray-200 font-medium break-words">
              {answer.text || `Answer ${index + 1}`}
            </span>
          </div>
        ))}
      </div>

      {allowMultiselect && (
        <p className="text-xs text-gray-400 mt-2">Select one or more options</p>
      )}
    </div>
  );
}
