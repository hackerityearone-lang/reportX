"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Users, UserPlus, Shield, Clock, Ban, CheckCircle, 
  Loader2, AlertTriangle, Crown, User
} from "lucide-react"
import { userManagementService } from "@/lib/supabase/user-management-service"
import type { Profile, UserRole } from "@/lib/types"

export function UserManagementPanel() {
  const [users, setUsers] = useState<Profile[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  
  // Create user form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "MANAGER" as UserRole,
  })

  useEffect(() => {
    loadUsers()
    loadStats()
  }, [])

  const loadUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await userManagementService.getAllUsers()
      setUsers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const data = await userManagementService.getUserStats()
      setStats(data)
    } catch (err) {
      console.error("Failed to load stats:", err)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      await userManagementService.approveUser(userId)
      setSuccess("User approved successfully!")
      loadUsers()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleBlock = async (userId: string) => {
    if (!confirm("Are you sure you want to block this user?")) return
    
    try {
      await userManagementService.blockUser(userId)
      setSuccess("User blocked successfully!")
      loadUsers()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUnblock = async (userId: string) => {
    try {
      await userManagementService.unblockUser(userId)
      setSuccess("User unblocked successfully!")
      loadUsers()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handlePromote = async (userId: string, newRole: UserRole) => {
    if (!confirm(`Promote user to ${newRole}? This will give them ${newRole === 'BOSS' ? 'full admin access' : 'manager permissions'}.`)) return
    
    try {
      await userManagementService.promoteToRole(userId, newRole)
      setSuccess(`User promoted to ${newRole} successfully!`)
      loadUsers()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateUser = async () => {
    setIsCreating(true)
    setError(null)

    try {
      await userManagementService.createUser(createForm)
      setSuccess("User created successfully!")
      setShowCreateForm(false)
      setCreateForm({
        email: "",
        password: "",
        full_name: "",
        role: "MANAGER",
      })
      loadUsers()
      loadStats()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "PENDING":
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "BLOCKED":
        return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" />Blocked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "BOSS":
        return <Badge className="bg-purple-600"><Crown className="h-3 w-3 mr-1" />Boss</Badge>
      case "MANAGER":
        return <Badge variant="outline"><Shield className="h-3 w-3 mr-1" />Manager</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  const filteredUsers = users.filter((user) => {
    if (activeTab === "all") return true
    if (activeTab === "pending") return user.status === "PENDING"
    if (activeTab === "approved") return user.status === "APPROVED"
    if (activeTab === "blocked") return user.status === "BLOCKED"
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <p className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Managers</p>
              </div>
              <p className="text-2xl font-bold">{stats.managers}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <p className="text-xs text-muted-foreground">Bosses</p>
              </div>
              <p className="text-2xl font-bold">{stats.bosses}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban className="h-4 w-4 text-red-500" />
                <p className="text-xs text-muted-foreground">Blocked</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{stats.blockedUsers}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Create New User</CardTitle>
            <CardDescription>Add a new MANAGER or BOSS to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={createForm.role} onValueChange={(val: UserRole) => setCreateForm({ ...createForm, role: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="BOSS">Boss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateUser} disabled={isCreating || !createForm.email || !createForm.password || !createForm.full_name}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {stats && stats.pendingApprovals > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.pendingApprovals}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-3">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-lg border hover:bg-secondary/5 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{user.full_name || "Unnamed User"}</p>
                            {getRoleBadge(user.role)}
                            {getStatusBadge(user.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {user.status === "PENDING" && (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(user.id)}
                              className="gap-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Approve
                            </Button>
                          )}

                          {user.status === "APPROVED" && user.role === "MANAGER" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePromote(user.id, "BOSS")}
                              className="gap-2"
                            >
                              <Crown className="h-3 w-3" />
                              Promote to Boss
                            </Button>
                          )}

                          {user.status === "APPROVED" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBlock(user.id)}
                              className="gap-2"
                            >
                              <Ban className="h-3 w-3" />
                              Block
                            </Button>
                          )}

                          {user.status === "BLOCKED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblock(user.id)}
                              className="gap-2"
                            >
                              <CheckCircle className="h-3 w-3" />
                              Unblock
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No users found in this category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default UserManagementPanel