import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import "./InstallPrompt.scss";

const DISMISS_KEY = "medstat_install_dismissed_at";
const INSTALLED_KEY = "medstat_install_installed";
const DISMISS_COOLDOWN_DAYS = 3;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isRecentlyDismissed() {
  const stored = localStorage.getItem(DISMISS_KEY);
  if (!stored) return false;

  const elapsedMs = Date.now() - Number(stored);
  return elapsedMs < DISMISS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
}

function isAlreadyInstalled() {
  const standaloneDisplay = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (window.navigator as any).standalone === true;
  const markedInstalled = localStorage.getItem(INSTALLED_KEY) === "true";
  return standaloneDisplay || iosStandalone || markedInstalled;
}

function isIos() {
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
}

export default function InstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);

  useEffect(() => {
    if (isAlreadyInstalled() || isRecentlyDismissed()) return;

    const markInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setVisible(false);
      setDeferredEvent(null);
    };

    window.addEventListener("appinstalled", markInstalled);

    if (isIos()) {
      setIosMode(true);
      setVisible(true);

      return () => {
        window.removeEventListener("appinstalled", markInstalled);
      };
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredEvent) return;

    await deferredEvent.prompt();
    const choice = await deferredEvent.userChoice;

    if (choice.outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
    }

    setVisible(false);
    setDeferredEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  if (iosMode) {
    return (
      <div className="install-prompt">
        <div className="install-prompt-icon">
          <Share size={20} />
        </div>

        <div className="install-prompt-text">
          <strong>نصب برنامه</strong>
          <span>
            برای نصب، دکمه Share را بزنید و «Add to Home Screen» را انتخاب کنید.
          </span>
        </div>

        <button
          type="button"
          className="install-prompt-close"
          onClick={handleDismiss}
          aria-label="بستن"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="install-prompt">
      <div className="install-prompt-icon">
        <Download size={20} />
      </div>

      <div className="install-prompt-text">
        <strong>نصب برنامه</strong>
        <span>برای دسترسی سریع‌تر، برنامه را روی دستگاه خود نصب کنید.</span>
      </div>

      <button type="button" className="install-prompt-install" onClick={handleInstall}>
        نصب
      </button>

      <button
        type="button"
        className="install-prompt-close"
        onClick={handleDismiss}
        aria-label="بستن"
      >
        <X size={16} />
      </button>
    </div>
  );
}
