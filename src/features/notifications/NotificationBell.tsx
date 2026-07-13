import { Bell } from "lucide-react";
import { Dropdown } from "../../components/ui/Dropdown";
import { useNotificationStore } from "../../store/notificationStore";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const count = useNotificationStore((s) => s.count);

  return (
    <Dropdown
      align="left"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="relative rounded-[3px] p-2 text-neutral-300 hover:bg-neutral-20 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {count > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger-600 text-[9px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      )}
    >
      {({ close }) => <NotificationPanel close={close} />}
    </Dropdown>
  );
}
