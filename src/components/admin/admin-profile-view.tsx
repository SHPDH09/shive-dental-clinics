"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminApiError, adminFetch } from "@/lib/admin-client";
import { DataLoadingSection } from "@/components/admin/loading-state";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ImageUploadField } from "@/components/admin/image-upload-field";

type Me = {
  id: string;
  dbLinked?: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  roleLabel: string;
  branchName: string | null;
  createdAt: string | null;
  lastLoginAt: string | null;
};

export function AdminProfileView() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch<Me>("/api/admin/me");
      setMe(data);
      setName(data.name);
      setPhone(data.phone ?? "");
      setPhoto(data.profilePhotoUrl ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (!me) return;
    setMessage(null);
    try {
      const updated = await adminFetch<{
        name?: string;
        phone?: string | null;
        profilePhotoUrl?: string | null;
      }>("/api/admin/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone: phone.trim() || null,
          profilePhotoUrl: photo || null,
        }),
      });
      if (updated.name) setName(updated.name);
      if (updated.phone !== undefined) setPhone(updated.phone ?? "");
      if (updated.profilePhotoUrl !== undefined) setPhoto(updated.profilePhotoUrl ?? "");
      setMe((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name ?? prev.name,
              phone: updated.phone !== undefined ? updated.phone : prev.phone,
              profilePhotoUrl:
                updated.profilePhotoUrl !== undefined ? updated.profilePhotoUrl : prev.profilePhotoUrl,
            }
          : prev,
      );
      setMessage("Profile updated.");
      await load();
    } catch (e) {
      setMessage(e instanceof AdminApiError ? e.message : e instanceof Error ? e.message : "Update failed");
    }
  };

  const changePassword = async () => {
    setMessage(null);
    try {
      await adminFetch("/api/admin/me", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, password, confirmPassword }),
      });
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setMessage("Password changed.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Password change failed");
    }
  };

  return (
    <DataLoadingSection loading={loading || !me} label="Loading profile…" minHeight="min-h-[40vh]">
    {me ? (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="card-premium flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-24 w-24 rounded-full object-cover ring-4 ring-sky-50" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-700">
            {me.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-slate-900">{me.name}</h2>
          <p className="text-sm text-slate-500">{me.email}</p>
          <p className="mt-1 text-sm">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">{me.roleLabel}</span>
            {me.branchName && (
              <span className="ml-2 text-slate-600">· {me.branchName}</span>
            )}
          </p>
          <dl className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
            <div>
              Created: {me.createdAt ? new Date(me.createdAt).toLocaleDateString() : "—"}
            </div>
            <div>
              Last login: {me.lastLoginAt ? new Date(me.lastLoginAt).toLocaleString() : "—"}
            </div>
          </dl>
        </div>
      </div>

      {!me.dbLinked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your sign-in is not linked to a clinic admin record. Ask a super admin to add{" "}
          <strong>{me.email ?? "your email"}</strong> under <strong>Admins</strong>, then sign out and sign in
          again.
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${message.includes("failed") || message.includes("invalid") || message.includes("missing") || message.includes("not found") || message.includes("Incorrect") || message.includes("linked") || message.includes("not registered") ? "text-red-600" : "text-teal-700"}`}
        >
          {message}
        </p>
      )}

      <div className="card-premium space-y-4 p-6">
        <h3 className="font-semibold text-slate-900">Edit profile</h3>
        <div>
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+919876543210" />
        </div>
        <ImageUploadField label="Profile photo" folder="profiles" value={photo} onChange={setPhoto} />
        <Button type="button" onClick={() => void saveProfile()}>
          Save profile
        </Button>
      </div>

      <div className="card-premium space-y-4 p-6">
        <h3 className="font-semibold text-slate-900">Change password</h3>
        <div>
          <Label>Current password</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label>Confirm password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={() => void changePassword()}>
          Update password
        </Button>
      </div>
    </div>
    ) : null}
    </DataLoadingSection>
  );
}
