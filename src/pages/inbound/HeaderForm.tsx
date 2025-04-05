import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import Select from "react-select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { emit } from "process";
import eventBus from "@/utils/eventBus";

export function HeaderForm({ formHeader, setFormHeader }) {
  const [optionsSupplier, setOptionsSupplier] = useState([]);
  const [optionsTransporter, setOptionsTransporter] = useState([]);
  const [optionsTruck, setOptionsTruck] = useState([]);
  const [originOptions, setOriginOptions] = useState([]);
  const handleSaveHeader = async () => {
    console.log("Form Header:", formHeader);
    try {
      const saveHeader = await api.post(
        "/inbound",
        {
          form_header: formHeader,
        },
        { withCredentials: true }
      );

      if (saveHeader.data.success) {
        eventBus.emit("showAlert", {
          title: "Success!",
          description: "Saved",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error saving inbound:", error);
      // alert("Error saving inbound");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suppliers, transporters, trucks, origins] = await Promise.all([
          api.get("/suppliers", { withCredentials: true }),
          api.get("/transporters", { withCredentials: true }),
          api.get("/trucks", { withCredentials: true }),
          api.get("/origins", { withCredentials: true }),
        ]);

        if (
          suppliers.data.success &&
          transporters.data.success &&
          trucks.data.success &&
          origins.data.success
        ) {
          setOptionsSupplier(
            suppliers.data.data.map((item) => ({
              value: item.ID,
              label: item.supplier_code + " - " + item.supplier_name,
            }))
          );
          setOptionsTransporter(
            transporters.data.data.map((item) => ({
              value: item.ID,
              label: item.transporter_code + " - " + item.transporter_name,
            }))
          );
          setOptionsTruck(
            trucks.data.data.map((item) => ({
              value: item.ID,
              label: item.truck_description,
            }))
          );
          setOriginOptions(
            origins.data.data.map((item) => ({
              value: item.ID,
              label: item.country,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {
          // setLoading(false);
        }, 500);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 p-4 pt-7">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inbound No
              </label>
              <Input
                type="text"
                value={formHeader.inbound_no}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Inbound Date
              </label>
              <Input
                type="date"
                value={formHeader.inbound_date}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, inbound_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin Country
              </label>
              <Select
                // defaultValue={}
                options={originOptions}
                onChange={(selectedOption) => {
                  setFormHeader({
                    ...formHeader,
                    origin_id: selectedOption.value,
                  });
                }}
                value={originOptions.find(
                  (option) => option.value === formHeader.origin_id
                )}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO No.
              </label>
              <Input
                type="text"
                value={formHeader.po_no}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, po_no: e.target.value })
                }
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PO Date
              </label>
              <Input
                type="date"
                value={formHeader.po_date}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, po_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SJ No.
              </label>
              <Input
                type="text"
                value={formHeader.sj_no}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, sj_no: e.target.value })
                }
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Arrival
              </label>
              <Input
                type="time"
                value={formHeader.time_arrival}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, time_arrival: e.target.value })
                }
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Unloading
              </label>
              <Input
                type="time"
                value={formHeader.start_unloading}
                onChange={(e) =>
                  setFormHeader({
                    ...formHeader,
                    start_unloading: e.target.value,
                  })
                }
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finish Unloading
              </label>
              <Input
                type="time"
                value={formHeader.finish_unloading}
                onChange={(e) =>
                  setFormHeader({
                    ...formHeader,
                    finish_unloading: e.target.value,
                  })
                }
                className="bg-gray-50"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <Textarea
                value={formHeader.remarks_header}
                onChange={(e) =>
                  setFormHeader({
                    ...formHeader,
                    remarks_header: e.target.value,
                  })
                }
                placeholder="Type your message here."
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="grid md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <Select
                  options={optionsSupplier}
                  onChange={(selectedOption) => {
                    setFormHeader({
                      ...formHeader,
                      supplier_id: selectedOption.value,
                    });
                  }}
                  value={optionsSupplier.find(
                    (item) => item.value === formHeader?.supplier_id
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transporter
                </label>
                <Select
                  options={optionsTransporter}
                  onChange={(selectedOption) => {
                    setFormHeader({
                      ...formHeader,
                      transporter_id: selectedOption.value,
                    });
                  }}
                  value={optionsTransporter.find(
                    (item) => item.value === formHeader?.transporter_id
                  )}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice No.
                </label>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormHeader({ ...formHeader, invoice: e.target.value })
                  }
                  value={formHeader.invoice}
                  placeholder="Enter invoice number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Driver Name
                </label>
                <Input
                  type="text"
                  onChange={(e) => {
                    setFormHeader({ ...formHeader, driver: e.target.value });
                  }}
                  value={formHeader.driver}
                  placeholder="Enter driver name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Truck Size.
                </label>
                <Select
                  options={optionsTruck}
                  onChange={(selectedOption) => {
                    setFormHeader({
                      ...formHeader,
                      truck_id: parseInt(selectedOption.value),
                    });
                  }}
                  value={optionsTruck.find(
                    (item) => item.value === formHeader?.truck_id
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Truck No.
                </label>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormHeader({ ...formHeader, truck_no: e.target.value })
                  }
                  value={formHeader.truck_no}
                  placeholder="Enter truck number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Container No.
                </label>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormHeader({
                      ...formHeader,
                      container_no: e.target.value,
                    })
                  }
                  value={formHeader.container_no}
                  placeholder="Enter container number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BL No.
                </label>
                <Input
                  type="text"
                  onChange={(e) =>
                    setFormHeader({ ...formHeader, bl_no: e.target.value })
                  }
                  value={formHeader.bl_no}
                  placeholder="Enter BL number"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {formHeader.inbound_id > 0 && (
        <div className="p-4 flex justify-end">
          <Button variant="outline" className="me-2">
            Cancel
          </Button>
          <Button onClick={handleSaveHeader} className="me-4">Save</Button>
        </div>
      )}
    </>
  );
}
