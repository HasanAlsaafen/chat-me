import { useRef, useState } from "react";
import toast from "react-hot-toast";
import clsx from "clsx";
import { Camera, Sun, Moon, Monitor } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import { usersApi } from "../../api/users";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore, type Theme, type Accent } from "../../store/themeStore";
import { getApiErrorMessage } from "../../api/client";

const themeOptions: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const accentOptions: { value: Accent; label: string; swatch: string }[] = [
  { value: "blue", label: "Blue", swatch: "#0065ff" },
  { value: "green", label: "Green", swatch: "#36b37e" },
  { value: "teal", label: "Teal", swatch: "#00a3bf" },
  { value: "purple", label: "Purple", swatch: "#6554c0" },
  { value: "pink", label: "Pink", swatch: "#e6198c" },
  { value: "red", label: "Red", swatch: "#de350b" },
  { value: "orange", label: "Orange", swatch: "#ff7f00" },
];

export function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
      });
      updateUser(updated);
      toast.success("Profile updated");
      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const updated = await usersApi.updateAvatar(file);
      updateUser(updated);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your profile"
      footer={
        <Button onClick={() => void save()} loading={saving}>
          Save changes
        </Button>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar src={user.avatar} name={user.displayName} size="xl" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand-600 text-white shadow-[var(--shadow-raised)] hover:bg-brand-500"
            aria-label="Change avatar"
          >
            {uploadingAvatar ? (
              <Spinner className="size-4 text-white" />
            ) : (
              <Camera className="size-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => void onAvatarSelected(e)}
          />
        </div>
        <div className="w-full">
          <Input
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-gray-200">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={160}
            rows={3}
            className="w-full rounded-[3px] border border-neutral-40 bg-neutral-10 px-3 py-2 text-sm text-neutral-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-900"
          />
          <p className="mt-1 text-right text-xs text-neutral-100">
            {bio.length}/160
          </p>
        </div>
        <div className="w-full border-t border-neutral-30 pt-3 dark:border-gray-800">
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-gray-200">
            Appearance
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-[3px] border px-2 py-2.5 text-xs font-medium transition-colors",
                  theme === value
                    ? "border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-200"
                    : "border-neutral-40 text-neutral-300 hover:bg-neutral-20 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full border-t border-neutral-30 pt-3 dark:border-gray-800">
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-gray-200">
            Accent color
          </label>
          <div className="flex flex-wrap gap-2">
            {accentOptions.map(({ value, label, swatch }) => (
              <button
                key={value}
                type="button"
                onClick={() => setAccent(value)}
                aria-label={label}
                aria-pressed={accent === value}
                title={label}
                className={clsx(
                  "flex size-8 items-center justify-center rounded-full ring-offset-2 ring-offset-white transition-shadow dark:ring-offset-gray-900",
                  accent === value
                    ? "ring-2 ring-neutral-700 dark:ring-gray-200"
                    : "ring-1 ring-neutral-40 hover:ring-neutral-100 dark:ring-gray-700",
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>
        <div className="w-full border-t border-neutral-30 pt-3 text-xs text-neutral-100 dark:border-gray-800">
          Signed in as {user.email}
        </div>
      </div>
    </Modal>
  );
}
