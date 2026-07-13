import { Download } from "lucide-react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

export function InstallButton() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className="rounded-[3px] p-2 text-neutral-300 hover:bg-neutral-20 dark:text-gray-300 dark:hover:bg-gray-800"
      aria-label="Install ChatMe app"
      title="Install app"
    >
      <Download className="size-5" />
    </button>
  );
}
