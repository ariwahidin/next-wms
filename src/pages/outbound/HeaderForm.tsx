import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import Select from "react-select";
import { Textarea } from "@/components/ui/textarea";
import { set } from "react-hook-form";

export function HeaderForm({
  formHeader,
  setFormHeader,
  dataForm,
  setDataForm,
}) {
  const [optionCustomers, setOptionCustomers] = useState([]);
  const [optionsSupplier, setOptionsSupplier] = useState([]);
  const [optionsTransporter, setOptionsTransporter] = useState([]);
  const [optionsTruck, setOptionsTruck] = useState([]);
  const [originOptions, setOriginOptions] = useState([]);

  const [loading, setLoading] = useState(true);

  // const [formHeader, setFormHeader] = useState({});

  const handleOptionCustomerChange = (selectedOption) => {
    // setDataForm({
    //   ...dataForm,
    //   form_header: {
    //     ...dataForm.form_header,
    //     customer_code: selectedOption.value,
    //   },
    // });
    setFormHeader({ ...formHeader, customer_code: selectedOption.value });
  };

  // const handleTransporterChange = (selectedOption) => {
  //   setDataHeader({ ...dataHeader, transporter_code: selectedOption.value });
  // };

  // const handleTruckChange = (selectedOption) => {
  //   setDataHeader({ ...dataHeader, truck_size: selectedOption.value });
  // };

  // const handleOriginChange = (selectedOption) => {
  //   setDataHeader({ ...dataHeader, origin: selectedOption.value });
  // };

  // set title
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customers] = await Promise.all([
          api.get("/customers/", { withCredentials: true }),
        ]);
        if (customers.data.success) {
          setOptionCustomers(
            customers.data.data?.map((item) => ({
              value: item.customer_code,
              label: item.customer_code + " - " + item.customer_name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 100);
      }
    };
    fetchData();
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4 p-4 pt-7">
      {/* <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Inbound No
            </label>
            <Input
              type="text"
              value={dataHeader.inbound_no}
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
              value={dataHeader.inbound_date}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, inbound_date: e.target.value })
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
              onChange={handleOriginChange}
              value={originOptions.find(
                (item) => item.value === dataHeader.origin
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
              value={dataHeader.po_no}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, po_no: e.target.value })
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
              value={dataHeader.po_date}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, po_date: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SJ No.
            </label>
            <Input
              type="text"
              value={dataHeader.sj_no}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, sj_no: e.target.value })
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
              value={dataHeader.time_arrival}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, time_arrival: e.target.value })
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
              value={dataHeader.start_unloading}
              onChange={(e) =>
                setDataHeader({
                  ...dataHeader,
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
              value={dataHeader.finish_unloading}
              onChange={(e) =>
                setDataHeader({
                  ...dataHeader,
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
              value={dataHeader.remarks_header}
              onChange={(e) =>
                setDataHeader({ ...dataHeader, remarks_header: e.target.value })
              }
              placeholder="Type your message here."
            />
          </div>
        </div>
      </div> */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Outbound Date
              </label>
              <Input
                type="date"
                value={formHeader.outbound_date}
                onChange={(e) =>
                  setFormHeader({ ...formHeader, outbound_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery No
              </label>
              <Input
                type="text"
                placeholder="Entry Delivery No"
                onChange={(e) => setFormHeader({ ...formHeader, delivery_no: e.target.value })}
                value={formHeader.delivery_no}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <Select
                options={optionCustomers}
                onChange={handleOptionCustomerChange}
                value={optionCustomers.find(
                  (item) => item.value === formHeader.customer_code
                )}
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporter
              </label>
              <Select
                options={optionsTransporter}
                onChange={handleTransporterChange}
                value={optionsTransporter.find(
                  (item) => item.value === dataHeader.transporter_code
                )}
              />
            </div> */}
          </div>

          {/* <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice No.
              </label>
              <Input
                type="text"
                onChange={(e) =>
                  setDataHeader({ ...dataHeader, invoice: e.target.value })
                }
                value={dataHeader.invoice}
                placeholder="Enter invoice number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name
              </label>
              <Input
                type="text"
                onChange={(e) =>
                  setDataHeader({ ...dataHeader, driver_name: e.target.value })
                }
                value={dataHeader.driver_name}
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Truck Size.
              </label>
              <Select
                options={optionsTruck}
                onChange={handleTruckChange}
                value={optionsTruck.find(
                  (item) => item.value === dataHeader.truck_size
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
                  setDataHeader({
                    ...dataHeader,
                    truck_no: e.target.value.toUpperCase(),
                  })
                }
                value={dataHeader.truck_no}
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
                  setDataHeader({
                    ...dataHeader,
                    container_no: e.target.value.toUpperCase(),
                  })
                }
                value={dataHeader.container_no}
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
                  setDataHeader({
                    ...dataHeader,
                    bl_no: e.target.value.toUpperCase(),
                  })
                }
                value={dataHeader.bl_no}
                placeholder="Enter BL number"
              />
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
