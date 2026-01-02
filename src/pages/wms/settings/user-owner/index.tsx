/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import eventBus from "@/utils/eventBus";
import {
    Users,
    Building2,
    Plus,
    Edit,
    Trash2,
    X,
    Check,
    Search,
} from "lucide-react";
import Layout from "@/components/layout";

interface Owner {
    ID: number;
    code: string;
    name: string;
    description: string;
}

interface User {
    ID: number;
    username: string;
    name: string;
    email: string;
    owners: Owner[];
}

export default function UserOwnerManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [availableOwners, setAvailableOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [ownerSearchTerm, setOwnerSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchAvailableOwners();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/users/owners/all", { withCredentials: true });
            setUsers(res.data.data || []);
        } catch (error: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: error.response?.data?.message || "Failed to fetch users",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableOwners = async () => {
        try {
            const res = await api.get("/users/owners/available", {
                withCredentials: true,
            });
            setAvailableOwners(res.data.data || []);
        } catch (error: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description: error.response?.data?.message || "Failed to fetch owners",
                type: "error",
            });
        }
    };

    const openModal = (user: User) => {
        setSelectedUser(user);
        setSelectedOwnerIds(user.owners?.map((o) => o.ID) || []);
        setIsModalOpen(true);
        setOwnerSearchTerm("");
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setSelectedOwnerIds([]);
        setOwnerSearchTerm("");
    };

    const toggleOwnerSelection = (ownerId: number) => {
        setSelectedOwnerIds((prev) =>
            prev.includes(ownerId)
                ? prev.filter((id) => id !== ownerId)
                : [...prev, ownerId]
        );
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        try {
            setLoading(true);

            if (selectedOwnerIds.length === 0) {
                // Delete all owners
                await api.delete(`/users/owners/${selectedUser.ID}`, {
                    withCredentials: true,
                });
            } else {
                // Update owners
                await api.put(
                    `/users/owners/${selectedUser.ID}`,
                    { owner_ids: selectedOwnerIds },
                    { withCredentials: true }
                );
            }

            eventBus.emit("showAlert", {
                title: "Success!",
                description: "User owners updated successfully",
                type: "success",
            });

            closeModal();
            fetchUsers();
        } catch (error: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description:
                    error.response?.data?.message || "Failed to update user owners",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: number, ownerId: number) => {
        if (!confirm("Are you sure you want to remove this owner?")) return;

        try {
            setLoading(true);
            await api.delete(`/users/owners/${userId}/${ownerId}`, {
                withCredentials: true,
            });

            eventBus.emit("showAlert", {
                title: "Success!",
                description: "Owner removed successfully",
                type: "success",
            });

            fetchUsers();
        } catch (error: any) {
            eventBus.emit("showAlert", {
                title: "Error",
                description:
                    error.response?.data?.message || "Failed to remove owner",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredOwners = availableOwners.filter(
        (owner) =>
            owner.name.toLowerCase().includes(ownerSearchTerm.toLowerCase()) ||
            owner.code.toLowerCase().includes(ownerSearchTerm.toLowerCase())
    );

    return (
        <Layout title="Settings" subTitle="User Owner Management">
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Users className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        User Owner Management
                                    </h1>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Manage owner assignments for users
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by username, name, or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Users List */}
                    {loading && !isModalOpen ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-600">Loading users...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <div
                                    key={user.ID}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <Users className="w-5 h-5 text-gray-700" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {user.name}
                                                    </h3>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-sm text-gray-600">
                                                            @{user.username}
                                                        </span>
                                                        <span className="text-sm text-gray-400">•</span>
                                                        <span className="text-sm text-gray-600">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Owners */}
                                            <div className="ml-14">
                                                {user.owners && user.owners.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {user.owners.map((owner) => (
                                                            <div
                                                                key={owner.ID}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg group"
                                                            >
                                                                <Building2 className="w-4 h-4 text-blue-600" />
                                                                <span className="text-sm font-medium text-blue-900">
                                                                    {owner.name}
                                                                </span>
                                                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                                                                    {owner.code}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleDelete(user.ID, owner.ID)}
                                                                    className="ml-1 p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove owner"
                                                                >
                                                                    <X className="w-3.5 h-3.5 text-red-600" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">
                                                        No owners assigned
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => openModal(user)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ml-4"
                                        >
                                            <Edit className="w-4 h-4" />
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredUsers.length === 0 && (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No users found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Manage Owners
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedUser.name} (@{selectedUser.username})
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Search Owners */}
                            <div className="p-6 border-b border-gray-200">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search owners..."
                                        value={ownerSearchTerm}
                                        onChange={(e) => setOwnerSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                    {selectedOwnerIds.length} owner(s) selected
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-2">
                                    {filteredOwners.map((owner) => (
                                        <label
                                            key={owner.ID}
                                            className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center h-6">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedOwnerIds.includes(owner.ID)}
                                                    onChange={() => toggleOwnerSelection(owner.ID)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="font-medium text-gray-900">
                                                        {owner.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {owner.code}
                                                    </span>
                                                </div>
                                                {owner.description && (
                                                    <p className="text-sm text-gray-600 ml-6">
                                                        {owner.description}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))}

                                    {filteredOwners.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                            <p>No owners found</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}