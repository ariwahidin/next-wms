// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useEffect, useState } from "react";
// import PermissionForm from "@/components/permission/PermissionForm";
// import Title from "@/components/ui/title";
// import { useRouter } from "next/router";
// import api from "@/lib/api";
// import eventBus from "@/utils/eventBus";
// import Layout from "@/components/layout";

// const EditPermissionPage = () => {
//   const router = useRouter();
//   const { id } = router.query;
//   const [permissionData, setPermissionData] = useState<any>(null);

//   const handleSubmit = (data: any) => {
//     api
//       .put(`/permissions/${id}`, data, {
//         withCredentials: true,
//       })
//       .then((res) => {
//         if (res.data.success) {
//           eventBus.emit("showAlert", {
//             title: "Success!",
//             description: res.data.message,
//             type: "success",
//           });
//           router.push("/master/permissions");
//         }
//       });
//   };

//   useEffect(() => {
//     if (!id) return;
//     const fetchPermissionData = async () => {
//       try {
//         const res = await api.get(`/permissions/${id}`, {
//           withCredentials: true,
//         });
//         if (res.data.success) {
//           setPermissionData(res.data.data);
//         }
//       } catch (error) {
//         console.error(error);
//       }
//     };
//     fetchPermissionData();
//   }, [id]);

//   return (

//     <Layout title="Master" subTitle="Permission">

//     <div className="container mx-auto p-4">
//       <Title>Edit Permission</Title>
//       {permissionData && (
//         <PermissionForm
//           mode="edit"
//           initialData={permissionData}
//           onSubmit={handleSubmit}
//         />
//       )}
//     </div>

//     </Layout>
//   );
// };

// export default EditPermissionPage;

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import PermissionForm from "@/components/permission/PermissionForm";
import Title from "@/components/ui/title";
import { useRouter } from "next/router";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import Layout from "@/components/layout";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

type Menu = {
  id: number;
  name: string;
  path: string;
};

const EditPermissionPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [permissionData, setPermissionData] = useState<any>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Fetch permission detail & menus
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [permissionRes, menusRes, selectedMenusRes] = await Promise.all([
          api.get(`/permissions/${id}`, { withCredentials: true }),
          api.get(`/menus`, { withCredentials: true }),
          api.get(`/menus/permissions/${id}`, { withCredentials: true }),
        ]);

        if (permissionRes.data.success) {
          setPermissionData(permissionRes.data.data);
        }

        setMenus(menusRes.data.data); // asumsinya array menu
        setSelectedMenuIds(selectedMenusRes.data.data.map((m: Menu) => m.id));
      } catch (err) {
        console.error("Fetch error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleFormSubmit = (data: any) => {
    api
      .put(`/permissions/${id}`, data, { withCredentials: true })
      .then((res) => {
        if (res.data.success) {
          eventBus.emit("showAlert", {
            title: "Success!",
            description: res.data.message,
            type: "success",
          });
          router.push("/master/permissions");
        }
      });
  };

  const handleMenuToggle = (menuId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSaveMenus = async () => {
    setSaving(true);
    try {
      const res = await api.post(
        `/menus/permissions/${id}`,
        { menu_ids: selectedMenuIds },
        { withCredentials: true }
      );
      if (res.data.success) {
        eventBus.emit("showAlert", {
          title: "Menus Updated",
          description: res.data.message,
          type: "success",
        });
      }
    } catch (err) {
      console.error("Failed to save menus", err);
      alert("Error saving menus.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Permissions" titleLink="/configuration/permissions" subTitle="Edit">
      <div className="container mx-auto p-4 space-y-6">
        <Title>Edit Permission</Title>

        {permissionData && (
          <PermissionForm
            mode="edit"
            initialData={permissionData}
            onSubmit={handleFormSubmit}
          />
        )}

        {!loading && (
          <div className="border rounded-md p-4 space-y-3">
            <h2 className="font-semibold text-lg">Assign Menus</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {menus.map((menu) => (
                <div key={menu.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`menu-${menu.id}`}
                    checked={selectedMenuIds.includes(menu.id)}
                    onCheckedChange={() => handleMenuToggle(menu.id)}
                  />
                  <label htmlFor={`menu-${menu.id}`}>
                    {menu.name} ({menu.path})
                  </label>
                </div>
              ))}
            </div>

            <Button onClick={handleSaveMenus} disabled={saving}>
              {saving ? "Saving..." : "Save Menus"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EditPermissionPage;
