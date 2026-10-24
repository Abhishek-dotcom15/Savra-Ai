"use client"

import { Suspense, useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ChevronLeft, MoreVertical, Trash2, LogOut, Loader2, AlertTriangle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useFetch } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

interface AdminProfile {
  id: string
  name: string
  email: string
  school?: {
    id: string
    name: string
    code: string
  }
  profileImage?: string | null
  createdAt?: string
}

function AdminProfileContent() {
  const router = useRouter()
  const { logout } = useAuth()

  // Fetch profile from API
  const { data: profile, isLoading: profileLoading, refetch } = useFetch<AdminProfile>("/admin/profile")

  // Local state for form
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Image upload state removed - using name initials instead

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
      setEmail(profile.email || "")
    }
  }, [profile])

  const handleSave = async () => {
    setSaveSuccess(false)
    setSaveError(null)
    setIsSaving(true)

    try {
      await api.put("/admin/profile", {
        name,
        email,
      })
      await refetch()
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  // Get initials from name for avatar
  const getInitials = (name: string) => {
    if (!name) return "?"
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  // Handle delete account
  const handleDeleteAccount = () => {
    setShowDeleteDialog(true)
    setDeletePassword("")
    setDeleteConfirmText("")
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      setDeleteError('Please type "DELETE MY ACCOUNT" to confirm')
      return
    }

    if (!deletePassword) {
      setDeleteError("Please enter your password")
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await api.delete("/auth/account", {
        password: deletePassword,
        confirmText: deleteConfirmText,
      })

      // Log out and redirect
      logout()
      router.push("/admin/login")
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account")
    } finally {
      setIsDeleting(false)
    }
  }

  // Loading skeleton
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const displayName = name || profile?.name || "Admin"

  return (
    <>
      {/* Success/Error Toast */}
      {saveSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg z-50">
          Profile updated successfully!
        </div>
      )}
      {saveError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg z-50">
          {saveError}
        </div>
      )}

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Your account will be scheduled for permanent deletion.
              You have 30 days to contact support if you wish to recover your account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {deleteError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your password
              </label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm
              </label>
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting || deleteConfirmText !== "DELETE MY ACCOUNT"}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Link href="/admin-dashboard">
              <ChevronLeft className="w-6 h-6 text-black cursor-pointer" />
            </Link>
            <h1 className="text-lg font-bold text-[#242220]">Admin Profile</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-5 h-5 text-black" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDeleteAccount} className="cursor-pointer text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2 text-red-600" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col flex-1 px-2">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full flex items-center justify-center bg-[#9B61FF] mb-3">
              <span className="text-white text-2xl font-bold">{getInitials(displayName)}</span>
            </div>
            <p className="text-sm font-medium text-[#9B61FF] mt-2">School Admin</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-[#242220] mb-2">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-[#AB79DA] rounded-lg px-4 py-3"
                placeholder="Enter your name"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[#242220] mb-2">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#AB79DA] rounded-lg px-4 py-3"
                placeholder="Enter your email"
                type="email"
              />
            </div>

          </div>

          {/* Save Button */}
          <div className="mt-6 pb-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#DF6647] hover:bg-[#DF6647]/90 text-white font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-h-screen p-8">
        <h1 className="text-3xl font-bold mb-8 text-[#353535]">Admin Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Details Section */}
          <div className="lg:col-span-2">
            <Card className="p-8 border border-[#DDDDDD] bg-[#FFFEFD]">
              <h2 className="text-xl font-medium mb-2 pb-4 border-b border-[#DDDDDD]">Account Details</h2>

              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-normal text-[#6A6A6A] mb-2">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#7D5CB0] rounded-lg px-4 py-6"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-normal text-[#6A6A6A] mb-2">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#7D5CB0] rounded-lg px-4 py-6"
                    placeholder="Enter your email"
                    type="email"
                  />
                </div>

                {/* Role Field (Read-only) */}
                <div>
                  <label className="block text-sm font-normal text-[#6A6A6A] mb-2">Role</label>
                  <div className="w-full border border-[#7D5CB0] rounded-lg px-4 py-3 bg-gray-50">
                    <span className="text-gray-700">School Admin</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-16">
                <Button
                  variant="outline"
                  onClick={handleDeleteAccount}
                  className="flex-1 border border-[#DF6647] text-[#DF6647] rounded-lg py-6 font-semibold bg-transparent"
                >
                  Delete Account
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-[#DF6647] text-white rounded-lg py-6 font-semibold disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </Card>
          </div>

          {/* Profile Card Section */}
          <div>
            <Card className="p-4 border border-gray-200 text-center sticky top-8 flex flex-col items-center">
              <h2 className="text-2xl font-medium mb-6 pb-4 border-b border-gray-200 w-full">Profile</h2>

              {/* Avatar */}
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-[#AB79DA] flex items-center justify-center bg-[#9B61FF]">
                  <span className="text-white text-2xl font-bold">{getInitials(displayName)}</span>
                </div>
              </div>
              <div className="mb-6" />

              {/* Profile Info */}
              <div className="space-y-4 mb-6 w-full">
                <div>
                  <h3 className="text-lg font-bold text-[#242220]">{displayName}</h3>
                  <p className="text-sm font-medium text-[#9B61FF]">School Admin</p>
                </div>
              </div>

              {/* Log Out Link */}
              <button
                onClick={handleLogout}
                className="text-[#E10000] border-t pt-6 border-gray-200 font-semibold text-center w-full"
              >
                Log Out
              </button>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

export default function AdminProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <AdminProfileContent />
    </Suspense>
  )
}
