import { useState } from "react";
import { FiDatabase, FiEdit2, FiPlus, FiRefreshCw, FiSave, FiUsers, FiBriefcase, FiDollarSign, FiList } from "react-icons/fi";
import { PageHeader } from "../../components/common/PageHeader";
import { TabMenu } from "../../components/common/TabMenu";
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
  category: "Vé tham quan",
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

  const [activeTab, setActiveTab] = useState("services");

  const tabs = [
    { id: "services", label: "Dịch vụ & bảng giá", icon: <FiDatabase /> },
    { id: "guides", label: "Hướng dẫn viên", icon: <FiUsers /> },
    { id: "partners", label: "Đối tác", icon: <FiBriefcase /> },
    { id: "perdiem", label: "Phụ cấp", icon: <FiDollarSign /> },
    { id: "catalogs", label: "Danh mục chung", icon: <FiList /> },
  ];

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

  const renderTabContent = () => {
    switch (activeTab) {
      case "services":
        return renderServicesTab();
      case "guides":
        return renderGuidesTab();
      case "partners":
        return renderPartnersTab();
      case "perdiem":
        return renderPerDiemTab();
      case "catalogs":
        return renderCatalogsTab();
      default:
        return null;
    }
  };

  const renderServicesTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <FiDatabase /> Dịch vụ & bảng giá
        </div>
        <p className="panel-description">
          Cập nhật giá tại đây sẽ ảnh hưởng ngay lập tức tới việc chuẩn hóa AI và các báo cáo tài chính.
        </p>
      </div>
      <div className="panel-body">
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Giá</th>
                <th>Đơn vị</th>
                <th>Đối tác</th>
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
                          <FiSave /> Lưu
                        </button>
                        <button className="ghost-button" onClick={() => setEditingService(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingService(service)}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removeService(service.id)}
                        >
                          Xóa
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
            <span>Tên dịch vụ</span>
            <input
              value={serviceForm.name}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Danh mục</span>
            <input
              value={serviceForm.category}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, category: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Đơn vị</span>
            <input
              value={serviceForm.unit}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, unit: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Giá</span>
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
            <span>Đối tác</span>
            <select
              value={serviceForm.partnerId}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, partnerId: event.target.value }))
              }
            >
              <option value="">Không</option>
              {masterData.partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            <span>Mô tả</span>
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
          <FiPlus /> Thêm dịch vụ
        </button>
      </div>
    </div>
  );

  const renderGuidesTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Hướng dẫn viên</div>
        <p className="panel-description">
          Cập nhật thông tin liên hệ để việc phân công của AI luôn chính xác.
        </p>
      </div>
      <div className="panel-body">
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Điện thoại</th>
                <th>Email</th>
                <th>Ngôn ngữ</th>
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
                          <FiSave /> Lưu
                        </button>
                        <button className="ghost-button" onClick={() => setEditingGuide(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingGuide(guide)}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removeGuide(guide.id)}
                        >
                          Xóa
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
            <span>Tên</span>
            <input
              value={guideForm.name}
              onChange={(event) =>
                setGuideForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Điện thoại</span>
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
            <span>Ngôn ngữ</span>
            <input
              value={guideForm.languages}
              onChange={(event) =>
                setGuideForm((current) => ({
                  ...current,
                  languages: event.target.value,
                }))
              }
              placeholder="Anh, Việt"
            />
          </label>
        </div>
        <button className="primary-button" onClick={handleAddGuide}>
          <FiPlus /> Thêm hướng dẫn viên
        </button>
      </div>
    </div>
  );

  const renderPartnersTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Đối tác & nhà cung cấp</div>
      </div>
      <div className="panel-body">
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Liên hệ</th>
                <th>Điện thoại</th>
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
                          <FiSave /> Lưu
                        </button>
                        <button className="ghost-button" onClick={() => setEditingPartner(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingPartner(partner)}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removePartner(partner.id)}
                        >
                          Xóa
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
            <span>Tên</span>
            <input
              value={partnerForm.name}
              onChange={(event) =>
                setPartnerForm((current) => ({ ...current, name: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Người liên hệ</span>
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
            <span>Điện thoại</span>
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
          <FiPlus /> Thêm đối tác
        </button>
      </div>
    </div>
  );

  const renderPerDiemTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Cấu hình phụ cấp</div>
      </div>
      <div className="panel-body">
        <div className="table-responsive">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>Địa điểm</th>
                <th>Mức phụ cấp</th>
                <th>Tiền tệ</th>
                <th>Ghi chú</th>
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
                          <FiSave /> Lưu
                        </button>
                        <button className="ghost-button" onClick={() => setEditingPerDiem(null)}>
                          Hủy
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="ghost-button"
                          onClick={() => setEditingPerDiem(rate)}
                        >
                          <FiEdit2 /> Chỉnh sửa
                        </button>
                        <button
                          className="ghost-button"
                          onClick={() => removePerDiemRate(rate.id)}
                        >
                          Xóa
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
            <span>Địa điểm</span>
            <input
              value={perDiemForm.location}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, location: event.target.value }))
              }
            />
          </label>
          <label>
            <span>Mức phụ cấp</span>
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
            <span>Tiền tệ</span>
            <input
              value={perDiemForm.currency}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, currency: event.target.value }))
              }
            />
          </label>
          <label className="full-width">
            <span>Ghi chú</span>
            <input
              value={perDiemForm.notes}
              onChange={(event) =>
                setPerDiemForm((current) => ({ ...current, notes: event.target.value }))
              }
            />
          </label>
        </div>
        <button className="primary-button" onClick={handleAddPerDiem}>
          <FiPlus /> Thêm mức phụ cấp
        </button>
      </div>
    </div>
  );

  const renderCatalogsTab = () => (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">Danh mục dùng chung</div>
        <p className="panel-description">
          Các danh sách này được sử dụng cho hộp chọn và thuật toán đối chiếu của AI.
        </p>
      </div>
      <div className="panel-body">
        <div className="catalog-grid">
          <div>
            <h3>Quốc tịch</h3>
            <ul className="pill-list">
              {masterData.catalogs.nationalities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="catalog-form">
              <input
                value={nationality}
                onChange={(event) => setNationality(event.target.value)}
                placeholder="Thêm quốc tịch"
              />
              <button className="ghost-button" onClick={addSharedNationality}>
                Thêm
              </button>
            </div>
          </div>
          <div>
            <h3>Loại dịch vụ</h3>
            <ul className="pill-list">
              {masterData.catalogs.serviceTypes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="catalog-form">
              <input
                value={serviceType}
                onChange={(event) => setServiceType(event.target.value)}
                placeholder="Thêm loại"
              />
              <button className="ghost-button" onClick={addSharedServiceType}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Danh mục Dữ liệu chuẩn"
        description="Duy trì nguồn dữ liệu chuẩn cho tất cả hướng dẫn viên, dịch vụ, đối tác và bảng cấu hình."
        actions={
          <button className="ghost-button" onClick={resetMasterData}>
            <FiRefreshCw /> Đặt lại mặc định
          </button>
        }
      />
      
      <TabMenu tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};