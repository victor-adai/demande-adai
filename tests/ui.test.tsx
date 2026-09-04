import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import CockpitBuilder from "@/components/cockpit-builder";
import messages from "@/messages/fr.json";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function renderCockpit() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <CockpitBuilder />
    </NextIntlClientProvider>
  );
}

describe("TC-13B — ROI CLIENT DISPLAY LOCK", () => {
  it("shows lock message when ROI is not validated", () => {
    renderCockpit();
    expect(screen.getByText(/Simulation masquée : valider les hypothèses ADAI/i)).toBeInTheDocument();
    expect(screen.queryByText(/Heures récupérables/i)).not.toBeInTheDocument();
  });

  it("shows ROI values after validation toggle", () => {
    renderCockpit();
    const toggle = screen.getByLabelText(/Hypothèses ROI validées par ADAI/i);
    fireEvent.click(toggle);
    const roiSection = document.querySelector("#roi-client");
    expect(roiSection).toBeTruthy();
    const roi = within(roiSection as HTMLElement);
    expect(roi.getByText(/Heures récupérables/i)).toBeInTheDocument();
    expect(roi.getByText(/Valeur brute du temps/i)).toBeInTheDocument();
    expect(roi.getByText(/Valeur économique réalisée/i)).toBeInTheDocument();
    expect(roi.getByText(/Payback/i)).toBeInTheDocument();
  });
});

describe("TC-15 — SAVE CLIENT REQUEST", () => {
  it("saves payload to localStorage when clicking Sauvegarder", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});
    renderCockpit();
    const saveBtn = screen.getByText(/Sauvegarder demande client/i);
    fireEvent.click(saveBtn);
    expect(setItem).toHaveBeenCalled();
    const [key, value] = setItem.mock.calls[0];
    expect(key).toMatch(/ADAI_V6_/);
    expect(() => JSON.parse(value as string)).not.toThrow();
    setItem.mockRestore();
  });
});

describe("TC-16 — PRINT / PDF", () => {
  it("calls window.print when clicking Imprimer", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    renderCockpit();
    const printBtn = screen.getByText(/Imprimer demande client \/ PDF/i);
    fireEvent.click(printBtn);
    expect(print).toHaveBeenCalled();
    print.mockRestore();
  });
});

describe("TC-17B — COPY JSON", () => {
  it("copies JSON payload to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.spyOn(window, "alert").mockImplementation(() => {});
    renderCockpit();
    const copyBtn = screen.getByText(/Copier JSON/i);
    fireEvent.click(copyBtn);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0];
    expect(() => JSON.parse(copied)).not.toThrow();
    expect(JSON.parse(copied).version).toBe("V6_MASTER");
  });
});

describe("TC-17C — DOWNLOAD JSON", () => {
  it("triggers download with JSON payload", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });

    renderCockpit();
    const downloadBtn = screen.getByText(/Télécharger JSON/i);
    fireEvent.click(downloadBtn);

    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    vi.unstubAllGlobals();
  });
});

describe("TC-DOMAIN — Domain / module interactions", () => {
  it("selecting a module activates its domain", () => {
    renderCockpit();
    const moduleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
    if (!moduleCheck) throw new Error("site_premium module checkbox not found");
    fireEvent.click(moduleCheck);
    const domainCard = moduleCheck.closest(".domain");
    expect(domainCard).toHaveClass("active");
  });

  it('"Réinitialiser les modules" clears all selections', () => {
    renderCockpit();
    const moduleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
    fireEvent.click(moduleCheck);
    expect(moduleCheck.checked).toBe(true);

    const resetBtn = screen.getByText(/Réinitialiser les modules/i);
    fireEvent.click(resetBtn);
    expect(moduleCheck.checked).toBe(false);
  });

  it('"Tout ouvrir" activates all domains without selecting modules', () => {
    renderCockpit();
    const openBtn = screen.getByText(/Tout ouvrir/i);
    fireEvent.click(openBtn);
    const activeDomains = document.querySelectorAll(".domain.active");
    expect(activeDomains.length).toBe(21);
    const checkedModules = document.querySelectorAll(".moduleCheck:checked");
    expect(checkedModules.length).toBe(0);
  });
});

describe("TC-RESET — Generic reset from UI", () => {
  it("reset button returns to START and clears modules", async () => {
    renderCockpit();
    const moduleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
    fireEvent.click(moduleCheck);
    expect(moduleCheck.checked).toBe(true);

    const growPack = screen.getByText("GROW").closest("button") as HTMLButtonElement;
    fireEvent.click(growPack);

    const resetBtn = screen.getByText("Réinitialiser").closest("button");
    if (!resetBtn) throw new Error("Reset button not found");
    fireEvent.click(resetBtn);

    await waitFor(() => {
      const resetModuleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
      return expect(resetModuleCheck?.checked ?? true).toBe(false);
    });
    const startPack = document.querySelector("#packs .pack.selected");
    expect(startPack).toHaveTextContent("START");
  });
});

describe("EMPTY DISPLAY STATE — placeholders below a qualified scope", () => {
  it("generic initial state shows placeholders, not misleading zeros", () => {
    renderCockpit();

    expect(document.querySelector(".summaryPrice")).toHaveTextContent("À calculer");
    expect(screen.getAllByText("À estimer").length).toBeGreaterThan(0);
    // Section #roi-adai masquée sur l'écran client — plus d'assertion sur son placeholder "—"
    expect(screen.getAllByText("EN ATTENTE").length).toBeGreaterThan(0);

    const cockpit = within(document.querySelector("#cockpit") as HTMLElement);
    expect(cockpit.getByText("En attente")).toBeInTheDocument();
    expect(cockpit.getByText("À valider")).toBeInTheDocument();
  });

  it("selecting a real module replaces placeholders with calculated values", () => {
    renderCockpit();

    const moduleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
    fireEvent.click(moduleCheck);

    expect(document.querySelector(".summaryPrice")).not.toHaveTextContent("À calculer");
    expect(screen.queryByText("À estimer")).not.toBeInTheDocument();

    const cockpit = within(document.querySelector("#cockpit") as HTMLElement);
    expect(cockpit.queryByText("En attente")).not.toBeInTheDocument();
    expect(cockpit.queryByText("À valider")).not.toBeInTheDocument();
  });

  it("placeholders reappear after reset", () => {
    renderCockpit();

    const moduleCheck = document.querySelector(`input[data-id="site_premium"]`) as HTMLInputElement;
    fireEvent.click(moduleCheck);
    expect(document.querySelector(".summaryPrice")).not.toHaveTextContent("À calculer");

    const resetBtn = screen.getByText("Réinitialiser").closest("button") as HTMLButtonElement;
    fireEvent.click(resetBtn);

    expect(document.querySelector(".summaryPrice")).toHaveTextContent("À calculer");
    expect(screen.getAllByText("À estimer").length).toBeGreaterThan(0);
  });
});
