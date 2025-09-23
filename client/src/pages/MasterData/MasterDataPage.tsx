import { useState } from "react";
import { FiDatabase, FiEdit2, FiPlus, FiRefreshCw, FiSave } from "react-icons/fi";
import { PageHeader } from "../../components/common/PageHeader";
import { useMasterData } from "../../contexts/MasterDataContext";
import type { Guide, Partner, PerDiemRate, Service } from "../../types";
import { formatCurrency } from "../../utils/format";

interface ServiceFormState {
  name: string;
  category: string;
  price: number;
  unit: string;
  partnerId: string;
  description: string;
}

interface GuideFormState {
  name: string;
  phone: string;
  email: string;
  languages: string;
}

interface PartnerFormState {
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

interface PerDiemFormState {
  location: string;
  rate: number;
  currency: string;
  notes: string;
}

const emptyServiceForm = (): ServiceFormState => ({
  name: "",
  category: "Entrance Fee",
  price: 0,
  unit: "",
  partnerId: "",
  description: "",
});

const emptyGuideForm = (): GuideFormState => ({
  name: "",
  phone: "",
  email: "",
  languages: "",
});

const emptyPartnerForm = (): PartnerFormState => ({
  name: "",
  contactName: "",
  phone: "",
  email: "",
});

const emptyPerDiemForm = (): PerDiemFormState => ({
  location: "",
  rate: 0,
  currency: "VND",
  notes: "",
});

export const MasterDataPage = () => {
  const {
    masterData,
    addService,
    updateService,
    removeService,
    addGuide,
    updateGuide,
    removeGuide,
    addPartner,
    updatePartner,
    removePartner,
    addPerDiemRate,
    updatePerDiemRate,
    removePerDiemRate,
    addNationality,
    addServiceType,
    resetMasterData,
  } = useMasterData();

  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [guideForm, setGuideForm] = useState<GuideFormState>(emptyGuideForm);
  const [partnerForm, setPartnerForm] = useState<PartnerFormState>(emptyPartnerForm);
  const [perDiemForm, setPerDiemForm] = useState<PerDiemFormState>(emptyPerDiemForm);

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [editingPerDiem, setEditingPerDiem] = useState<PerDiemRate | null>(null);
  const [nationality, setNationality] = useState("");
  const [serviceType, setServiceType] = useState("");

  const handleAddService = () => {
    if (!serviceForm.name.trim() || serviceForm.price <= 0 || !serviceForm.unit.trim()) {
      return;
    }
    addService({
      name: serviceForm.name.trim(),
      category: serviceForm.category,
      price: serviceForm.price,
      unit: serviceForm.unit.trim(),
      partnerId: serviceForm.partnerId || undefined,
      description: serviceForm.description || undefined,
    });
    setServiceForm(emptyServiceForm());
  };

  const handleSaveService = () => {
    if (!editingService) return;
    if (!editingService.name.trim() || editingService.price <= 0) return;
    updateService(editingService.id, {
      name: editingService.name.trim(),
      category: editingService.category,
      price: editingService.price,
      unit: editingService.unit,
      partnerId: editingService.partnerId,
      description: editingService.description,
    });
    setEditingService(null);
  };

  const handleAddGuide = () => {
    if (!guideForm.name.trim()) return;
    addGuide({
      name: guideForm.name.trim(),
      phone: guideForm.phone || undefined,
      email: guideForm.email || undefined,
      languages: guideForm.languages
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    });
    setGuideForm(emptyGuideForm());
  };

  const handleSaveGuide = () => {
    if (!editingGuide) return;
    if (!editingGuide.name.trim()) return;
    updateGuide(editingGuide.id, {
      name: editingGuide.name.trim(),
      phone: editingGuide.phone,
      email: editingGuide.email,
      languages: editingGuide.languages,
    });
    setEditingGuide(null);
  };

  const handleAddPartner = () => {
    if (!partnerForm.name.trim()) return;
    addPartner({
      name: partnerForm.name.trim(),
      contactName: partnerForm.contactName || undefined,
      phone: partnerForm.phone || undefined,
      email: partnerForm.email || undefined,
    });
    setPartnerForm(emptyPartnerForm());
  };

  const handleSavePartner = () => {
    if (!editingPartner) return;
    if (!editingPartner.name.trim()) return;
    updatePartner(editingPartner.id, {
      name: editingPartner.name.trim(),
      contactName: editingPartner.contactName,
      phone: editingPartner.phone,
      email: editingPartner.email,
    });
    setEditingPartner(null);
  };

  const handleAddPerDiem = () => {
    if (!perDiemForm.location.trim() || perDiemForm.rate <= 0) return;
    addPerDiemRate({
      location: perDiemForm.location.trim(),
      rate: perDiemForm.rate,
      currency: perDiemForm.currency,
      notes: perDiemForm.notes || undefined,
    });
    setPerDiemForm(emptyPerDiemForm());
  };

  const handleSavePerDiem = () => {
    if (!editingPerDiem) return;
    if (!editingPerDiem.location.trim()) return;
    updatePerDiemRate(editingPerDiem.id, {
      location: editingPerDiem.location.trim(),
      rate: editingPerDiem.rate,
      currency: editingPerDiem.currency,
      notes: editingPerDiem.notes,
    });
    setEditingPerDiem(null);
  };

  const addSharedNationality = () => {
    if (!nationality.trim()) return;
    addNationality(nationality);
    setNationality("");
  };

  const addSharedServiceType = () => {
    if (!serviceType.trim()) return;
    addServiceType(serviceType);
    setServiceType("");
  };

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Master Data catalogue"
        description="Maintain the source-of-truth for all guides, services, partners and configuration tables."
        actions={
          <button className="ghost-button" onClick={resetMasterData}>
            <FiRefreshCw /> Reset to defaults
          </button>
        }
      />
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <FiDatabase /> Services & price list
          </div>
          <p className="panel-description">
            Updating a price here immediately impacts AI normalisation and downstream financial reports.
          </p>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>Partner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {masterData.services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      {editingService?.id === service.id ? (
                        <input
                          value={editingService.name}
                          onChange={(event) =>
                            setEditingService((current) =>
                              current ? { ...current, name: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        service.name
                      )}
                    </td>
                    <td>
                      {editingService?.id === service.id ? (
                        <input
                          value={editingService.category}
                          onChange={(event) =>
                            setEditingService((current) =>
                              current ? { ...current, category: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        service.category
                      )}
                    </td>
                    <td>
                      {editingService?.id === service.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editingService.price}
                          onChange={(event) =>
                            setEditingService((current) =>
                              current
                                ? { ...current, price: Math.max(0, Number(event.target.value)) }
                                : current,
                            )
                          }
                        />
                      ) : (
                        formatCurrency(service.price)
                      )}
                    </td>
                    <td>
                      {editingService?.id === service.id ? (
                        <input
                          value={editingService.unit}
                          onChange={(event) =>
                            setEditingService((current) =>
                              current ? { ...current, unit: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        service.unit
                      )}
                    </td>
                    <td>
                      {editingService?.id === service.id ? (
                        <select
                          value={editingService.partnerId ?? ""}
                          onChange={(event) =>
                            setEditingService((current) =>
                              current
                                ? { ...current, partnerId: event.target.value || undefined }
                                : current,
                            )
                          }
                        >
                          <option value="">—</option>
                          {masterData.partners.map((partner) => (
                            <option key={partner.id} value={partner.id}>
                              {partner.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        masterData.partners.find((partner) => partner.id === service.partnerId)?.name || "—"
                      )}
                    </td>
                    <td className="table-actions">
                      {editingService?.id === service.id ? (
                        <>
                          <button className="primary-button" onClick={handleSaveService}>
                            <FiSave /> Save
                          </button>
                          <button className="ghost-button" onClick={() => setEditingService(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="ghost-button"
                            onClick={() => setEditingService(service)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            className="ghost-button"
                            onClick={() => removeService(service.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid">
            <label>
              <span>Service name</span>
              <input
                value={serviceForm.name}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Category</span>
              <input
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, category: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Unit</span>
              <input
                value={serviceForm.unit}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, unit: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Price</span>
              <input
                type="number"
                min={0}
                value={serviceForm.price}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    price: Math.max(0, Number(event.target.value)),
                  }))
                }
              />
            </label>
            <label>
              <span>Partner</span>
              <select
                value={serviceForm.partnerId}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, partnerId: event.target.value }))
                }
              >
                <option value="">None</option>
                {masterData.partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-width">
              <span>Description</span>
              <input
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
          </div>
          <button className="primary-button" onClick={handleAddService}>
            <FiPlus /> Add service
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Guides</div>
          <p className="panel-description">
            Keep contact information updated so AI assignments stay accurate.
          </p>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Languages</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {masterData.guides.map((guide) => (
                  <tr key={guide.id}>
                    <td>
                      {editingGuide?.id === guide.id ? (
                        <input
                          value={editingGuide.name}
                          onChange={(event) =>
                            setEditingGuide((current) =>
                              current ? { ...current, name: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        guide.name
                      )}
                    </td>
                    <td>
                      {editingGuide?.id === guide.id ? (
                        <input
                          value={editingGuide.phone ?? ""}
                          onChange={(event) =>
                            setEditingGuide((current) =>
                              current ? { ...current, phone: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        guide.phone || "—"
                      )}
                    </td>
                    <td>
                      {editingGuide?.id === guide.id ? (
                        <input
                          value={editingGuide.email ?? ""}
                          onChange={(event) =>
                            setEditingGuide((current) =>
                              current ? { ...current, email: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        guide.email || "—"
                      )}
                    </td>
                    <td>
                      {editingGuide?.id === guide.id ? (
                        <input
                          value={(editingGuide.languages ?? []).join(", ")}
                          onChange={(event) =>
                            setEditingGuide((current) =>
                              current
                                ? {
                                    ...current,
                                    languages: event.target.value
                                      .split(",")
                                      .map((language) => language.trim())
                                      .filter(Boolean),
                                  }
                                : current,
                            )
                          }
                        />
                      ) : (
                        (guide.languages ?? []).join(", ") || "—"
                      )}
                    </td>
                    <td className="table-actions">
                      {editingGuide?.id === guide.id ? (
                        <>
                          <button className="primary-button" onClick={handleSaveGuide}>
                            <FiSave /> Save
                          </button>
                          <button className="ghost-button" onClick={() => setEditingGuide(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="ghost-button"
                            onClick={() => setEditingGuide(guide)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            className="ghost-button"
                            onClick={() => removeGuide(guide.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input
                value={guideForm.name}
                onChange={(event) =>
                  setGuideForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={guideForm.phone}
                onChange={(event) =>
                  setGuideForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={guideForm.email}
                onChange={(event) =>
                  setGuideForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
            <label className="full-width">
              <span>Languages</span>
              <input
                value={guideForm.languages}
                onChange={(event) =>
                  setGuideForm((current) => ({
                    ...current,
                    languages: event.target.value,
                  }))
                }
                placeholder="English, Vietnamese"
              />
            </label>
          </div>
          <button className="primary-button" onClick={handleAddGuide}>
            <FiPlus /> Add guide
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Partners & suppliers</div>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {masterData.partners.map((partner) => (
                  <tr key={partner.id}>
                    <td>
                      {editingPartner?.id === partner.id ? (
                        <input
                          value={editingPartner.name}
                          onChange={(event) =>
                            setEditingPartner((current) =>
                              current ? { ...current, name: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        partner.name
                      )}
                    </td>
                    <td>
                      {editingPartner?.id === partner.id ? (
                        <input
                          value={editingPartner.contactName ?? ""}
                          onChange={(event) =>
                            setEditingPartner((current) =>
                              current
                                ? { ...current, contactName: event.target.value }
                                : current,
                            )
                          }
                        />
                      ) : (
                        partner.contactName || "—"
                      )}
                    </td>
                    <td>
                      {editingPartner?.id === partner.id ? (
                        <input
                          value={editingPartner.phone ?? ""}
                          onChange={(event) =>
                            setEditingPartner((current) =>
                              current ? { ...current, phone: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        partner.phone || "—"
                      )}
                    </td>
                    <td>
                      {editingPartner?.id === partner.id ? (
                        <input
                          value={editingPartner.email ?? ""}
                          onChange={(event) =>
                            setEditingPartner((current) =>
                              current ? { ...current, email: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        partner.email || "—"
                      )}
                    </td>
                    <td className="table-actions">
                      {editingPartner?.id === partner.id ? (
                        <>
                          <button className="primary-button" onClick={handleSavePartner}>
                            <FiSave /> Save
                          </button>
                          <button className="ghost-button" onClick={() => setEditingPartner(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="ghost-button"
                            onClick={() => setEditingPartner(partner)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            className="ghost-button"
                            onClick={() => removePartner(partner.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid">
            <label>
              <span>Name</span>
              <input
                value={partnerForm.name}
                onChange={(event) =>
                  setPartnerForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Contact person</span>
              <input
                value={partnerForm.contactName}
                onChange={(event) =>
                  setPartnerForm((current) => ({
                    ...current,
                    contactName: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={partnerForm.phone}
                onChange={(event) =>
                  setPartnerForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={partnerForm.email}
                onChange={(event) =>
                  setPartnerForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </label>
          </div>
          <button className="primary-button" onClick={handleAddPartner}>
            <FiPlus /> Add partner
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Per diem configuration</div>
        </div>
        <div className="panel-body">
          <div className="table-responsive">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Rate</th>
                  <th>Currency</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {masterData.perDiemRates.map((rate) => (
                  <tr key={rate.id}>
                    <td>
                      {editingPerDiem?.id === rate.id ? (
                        <input
                          value={editingPerDiem.location}
                          onChange={(event) =>
                            setEditingPerDiem((current) =>
                              current ? { ...current, location: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        rate.location
                      )}
                    </td>
                    <td>
                      {editingPerDiem?.id === rate.id ? (
                        <input
                          type="number"
                          min={0}
                          value={editingPerDiem.rate}
                          onChange={(event) =>
                            setEditingPerDiem((current) =>
                              current
                                ? { ...current, rate: Math.max(0, Number(event.target.value)) }
                                : current,
                            )
                          }
                        />
                      ) : (
                        formatCurrency(rate.rate, rate.currency)
                      )}
                    </td>
                    <td>
                      {editingPerDiem?.id === rate.id ? (
                        <input
                          value={editingPerDiem.currency}
                          onChange={(event) =>
                            setEditingPerDiem((current) =>
                              current ? { ...current, currency: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        rate.currency
                      )}
                    </td>
                    <td>
                      {editingPerDiem?.id === rate.id ? (
                        <input
                          value={editingPerDiem.notes ?? ""}
                          onChange={(event) =>
                            setEditingPerDiem((current) =>
                              current ? { ...current, notes: event.target.value } : current,
                            )
                          }
                        />
                      ) : (
                        rate.notes || "—"
                      )}
                    </td>
                    <td className="table-actions">
                      {editingPerDiem?.id === rate.id ? (
                        <>
                          <button className="primary-button" onClick={handleSavePerDiem}>
                            <FiSave /> Save
                          </button>
                          <button className="ghost-button" onClick={() => setEditingPerDiem(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="ghost-button"
                            onClick={() => setEditingPerDiem(rate)}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            className="ghost-button"
                            onClick={() => removePerDiemRate(rate.id)}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid">
            <label>
              <span>Location</span>
              <input
                value={perDiemForm.location}
                onChange={(event) =>
                  setPerDiemForm((current) => ({ ...current, location: event.target.value }))
                }
              />
            </label>
            <label>
              <span>Rate</span>
              <input
                type="number"
                min={0}
                value={perDiemForm.rate}
                onChange={(event) =>
                  setPerDiemForm((current) => ({
                    ...current,
                    rate: Math.max(0, Number(event.target.value)),
                  }))
                }
              />
            </label>
            <label>
              <span>Currency</span>
              <input
                value={perDiemForm.currency}
                onChange={(event) =>
                  setPerDiemForm((current) => ({ ...current, currency: event.target.value }))
                }
              />
            </label>
            <label className="full-width">
              <span>Notes</span>
              <input
                value={perDiemForm.notes}
                onChange={(event) =>
                  setPerDiemForm((current) => ({ ...current, notes: event.target.value }))
                }
              />
            </label>
          </div>
          <button className="primary-button" onClick={handleAddPerDiem}>
            <FiPlus /> Add rate
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Shared catalogues</div>
          <p className="panel-description">
            These lists feed dropdowns and the AI matching heuristics.
          </p>
        </div>
        <div className="panel-body">
          <div className="catalog-grid">
            <div>
              <h3>Nationalities</h3>
              <ul className="pill-list">
                {masterData.catalogs.nationalities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="catalog-form">
                <input
                  value={nationality}
                  onChange={(event) => setNationality(event.target.value)}
                  placeholder="Add nationality"
                />
                <button className="ghost-button" onClick={addSharedNationality}>
                  Add
                </button>
              </div>
            </div>
            <div>
              <h3>Service types</h3>
              <ul className="pill-list">
                {masterData.catalogs.serviceTypes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="catalog-form">
                <input
                  value={serviceType}
                  onChange={(event) => setServiceType(event.target.value)}
                  placeholder="Add type"
                />
                <button className="ghost-button" onClick={addSharedServiceType}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
