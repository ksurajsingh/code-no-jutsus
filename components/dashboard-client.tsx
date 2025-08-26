"use client"

import { useState } from "react"
import { Button } from "./button"
import { ShoppingCart, Coins, Plus, User } from "./icons"
import { VendingMachineModal } from "./vending-machine-modal"
import { PointsHistoryModal } from "./points-history-modal"
import { DoubtPostingModal } from "./doubt-posting-modal"
import { ProfileEditModal } from "./profile-edit-modal"
import { SessionManagementModal } from "./session-management-modal"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./dropdown-menu"

export function DashboardClient() {
  const [showVendingMachine, setShowVendingMachine] = useState(false)
  const [showPointsHistory, setShowPointsHistory] = useState(false)
  const [showPostDoubt, setShowPostDoubt] = useState(false)
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [showSessionManagement, setShowSessionManagement] = useState(false)
  const [userProfile, setUserProfile] = useState({ points: 0, full_name: "User" })
  const [selectedSession, setSelectedSession] = useState(null)

  const handleSignOut = () => {
    // Sign out logic here
  }

  const handleDoubtPosted = () => {
    // Doubt posted logic here
  }

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile)
  }

  const handleSessionUpdated = (updatedSession) => {
    setSelectedSession(updatedSession)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                DoubtSolve
              </h1>
              <div className="hidden md:flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm">
                  My Doubts
                </Button>
                <Button variant="ghost" size="sm">
                  Leaderboard
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Vending Machine Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVendingMachine(true)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Vending Machine
              </Button>

              {/* Points History Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPointsHistory(true)}
                className="flex items-center gap-2"
              >
                <Coins className="h-4 w-4" />
                {userProfile?.points || 0} Points
              </Button>

              {/* Post a Doubt Button */}
              <Button onClick={() => setShowPostDoubt(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Post a Doubt
              </Button>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {userProfile?.full_name || "User"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowProfileEdit(true)}>Edit Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>Sign Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <DoubtPostingModal
        isOpen={showPostDoubt}
        onClose={() => setShowPostDoubt(false)}
        onDoubtPosted={handleDoubtPosted}
      />

      <ProfileEditModal
        isOpen={showProfileEdit}
        onClose={() => setShowProfileEdit(false)}
        profile={userProfile}
        onProfileUpdated={handleProfileUpdated}
      />

      <SessionManagementModal
        isOpen={showSessionManagement}
        onClose={() => setShowSessionManagement(false)}
        session={selectedSession}
        onSessionUpdated={handleSessionUpdated}
      />

      {/* Vending Machine Modal */}
      <VendingMachineModal
        isOpen={showVendingMachine}
        onClose={() => setShowVendingMachine(false)}
        userPoints={userProfile?.points || 0}
        onPointsUpdate={(newPoints) => {
          if (userProfile) {
            setUserProfile({ ...userProfile, points: newPoints })
          }
        }}
      />

      {/* Points History Modal */}
      <PointsHistoryModal isOpen={showPointsHistory} onClose={() => setShowPointsHistory(false)} />
    </div>
  )
}
