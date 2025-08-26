"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flame, User, Settings, LogOut, Plus, MessageCircle, Video, Eye, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface DashboardContentProps {
  user: any
  profile: any
}

export default function DashboardContent({ user, profile }: DashboardContentProps) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [doubts, setDoubts] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [activeSessions, setActiveSessions] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("All")
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedSemester, setSelectedSemester] = useState("All")
  const [selectedSubject, setSelectedSubject] = useState("All")
  const [isPostDoubtOpen, setIsPostDoubtOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(null)

  // Form states
  const [doubtForm, setDoubtForm] = useState({
    title: "",
    description: "",
    subject_id: "",
    tags: "",
    subtags: "",
    reward_points: 10,
  })

  const branches = ["All", "CSE", "ISE", "AIML", "CY", "DS", "ECE", "EIE", "EEE", "ETE"]
  const years = ["All", "1st", "2nd", "3rd", "4th"]
  const semesters = ["All", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"]

  useEffect(() => {
    fetchDoubts()
    fetchLeaderboard()
    fetchActiveSessions()

    // Set up real-time subscriptions
    const doubtsSubscription = supabase
      .channel("doubts")
      .on("postgres_changes", { event: "*", schema: "public", table: "doubt_threads" }, () => {
        fetchDoubts()
      })
      .subscribe()

    const sessionsSubscription = supabase
      .channel("sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "help_sessions" }, () => {
        fetchActiveSessions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(doubtsSubscription)
      supabase.removeChannel(sessionsSubscription)
    }
  }, [])

  const fetchDoubts = async () => {
    const { data, error } = await supabase
      .from("doubt_threads")
      .select(`
        *,
        profiles!doubt_threads_author_id_fkey(full_name, branch, year),
        subjects(name),
        upvotes(count)
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching doubts:", error)
    } else {
      setDoubts(data || [])
    }
  }

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, branch, total_points")
      .order("total_points", { ascending: false })
      .limit(8)

    if (error) {
      console.error("Error fetching leaderboard:", error)
    } else {
      setLeaderboard(data || [])
    }
  }

  const fetchActiveSessions = async () => {
    const { data, error } = await supabase
      .from("help_sessions")
      .select(`
        *,
        doubt_threads(title, subject_id, author_id, profiles!doubt_threads_author_id_fkey(full_name)),
        helper_profile:profiles!help_sessions_helper_id_fkey(full_name)
      `)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching active sessions:", error)
    } else {
      setActiveSessions(data || [])
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handlePostDoubt = async () => {
    if (!doubtForm.title || !doubtForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const { error } = await supabase.from("doubt_threads").insert({
      title: doubtForm.title,
      description: doubtForm.description,
      author_id: user.id,
      subject_id: doubtForm.subject_id || null,
      tags: doubtForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      subtags: doubtForm.subtags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      reward_points: doubtForm.reward_points,
      status: "open",
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post doubt. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success!",
        description: "Your doubt has been posted successfully.",
      })
      setIsPostDoubtOpen(false)
      setDoubtForm({
        title: "",
        description: "",
        subject_id: "",
        tags: "",
        subtags: "",
        reward_points: 10,
      })
      fetchDoubts()
    }
  }

  const handleUpvote = async (doubtId: string) => {
    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from("upvotes")
      .select("id")
      .eq("doubt_id", doubtId)
      .eq("user_id", user.id)
      .single()

    if (existingUpvote) {
      toast({
        title: "Already Upvoted",
        description: "You have already upvoted this doubt.",
        variant: "destructive",
      })
      return
    }

    // Add upvote
    const { error: upvoteError } = await supabase.from("upvotes").insert({ doubt_id: doubtId, user_id: user.id })

    if (upvoteError) {
      toast({
        title: "Error",
        description: "Failed to upvote. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Award points to doubt author (5 points per upvote)
    const doubt = doubts.find((d) => d.id === doubtId)
    if (doubt) {
      await supabase.rpc("award_points", {
        user_id: doubt.author_id,
        points_to_add: 5,
        description: "Received upvote on doubt",
      })
    }

    toast({
      title: "Upvoted!",
      description: "You've successfully upvoted this doubt. The author earned 5 points!",
    })

    fetchDoubts()
    fetchLeaderboard()
  }

  const handleOfferHelp = async (doubtId: string, sessionType: "text" | "video") => {
    const { error } = await supabase.from("help_sessions").insert({
      doubt_id: doubtId,
      helper_id: user.id,
      student_id: doubts.find((d) => d.id === doubtId)?.author_id,
      session_type: sessionType,
      status: "pending",
    })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to offer help. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Help Offered!",
        description: `You've offered to help via ${sessionType}. The student will be notified.`,
      })
      setIsHelpModalOpen(false)
      fetchActiveSessions()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DS</span>
              </div>
              <span className="text-xl font-bold text-foreground">DoubtSolve</span>
            </div>

            {/* Right side items */}
            <div className="flex items-center space-x-4">
              {/* Points Display */}
              <div className="flex items-center space-x-2 bg-muted px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-foreground">
                  {profile?.total_points?.toLocaleString() || 0} pts
                </span>
              </div>

              {/* Post Doubt Button */}
              <Dialog open={isPostDoubtOpen} onOpenChange={setIsPostDoubtOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl">
                    <Plus className="w-4 h-4 mr-2" />
                    Post a Doubt
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post a New Doubt</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={doubtForm.title}
                        onChange={(e) => setDoubtForm({ ...doubtForm, title: e.target.value })}
                        placeholder="Enter your doubt title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={doubtForm.description}
                        onChange={(e) => setDoubtForm({ ...doubtForm, description: e.target.value })}
                        placeholder="Describe your doubt in detail"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          value={doubtForm.tags}
                          onChange={(e) => setDoubtForm({ ...doubtForm, tags: e.target.value })}
                          placeholder="algorithms, data-structures"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtags">Subtags</Label>
                        <Input
                          id="subtags"
                          value={doubtForm.subtags}
                          onChange={(e) => setDoubtForm({ ...doubtForm, subtags: e.target.value })}
                          placeholder="linked-list, sorting"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="reward">Reward Points</Label>
                      <Input
                        id="reward"
                        type="number"
                        value={doubtForm.reward_points}
                        onChange={(e) =>
                          setDoubtForm({ ...doubtForm, reward_points: Number.parseInt(e.target.value) || 10 })
                        }
                        min="5"
                        max="100"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsPostDoubtOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handlePostDoubt}>Post Doubt</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/diverse-student-profiles.png" alt="Profile" />
                      <AvatarFallback>
                        {profile?.full_name
                          ?.split(" ")
                          .map((n: string) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="px-2 py-1.5 text-sm">
                    <p className="font-medium text-foreground">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={handleProfileClick} className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center space-x-2">
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="feed" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feed">Doubt Feed</TabsTrigger>
              <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Feed */}
                <div className="flex-1">
                  {/* Filters */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Live Doubt Feed</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue placeholder="Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches.map((branch) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {semesters.map((semester) => (
                            <SelectItem key={semester} value={semester}>
                              {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="bg-card border-border">
                          <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Subjects</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Doubt Cards */}
                  <div className="space-y-4">
                    {doubts.map((doubt) => (
                      <Card
                        key={doubt.id}
                        className="bg-card border-border hover:shadow-lg transition-all duration-200 hover:border-blue-500/20"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                                {doubt.subjects?.name || "General"}
                              </Badge>
                              {doubt.tags && doubt.tags.length > 0 && (
                                <div className="flex space-x-1">
                                  {doubt.tags.slice(0, 2).map((tag: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleUpvote(doubt.id)}
                                className="flex items-center space-x-1 text-muted-foreground hover:text-orange-400"
                              >
                                <span className="text-sm">{doubt.upvotes?.length || 0}</span>
                                <Flame className="w-4 h-4" />
                              </Button>
                              <Badge variant="secondary" className="bg-green-500/10 text-green-400">
                                {doubt.reward_points} pts
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-lg font-semibold text-foreground leading-tight">
                            {doubt.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{doubt.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {doubt.profiles?.full_name
                                    ?.split(" ")
                                    .map((n: string) => n[0])
                                    .join("") || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                {doubt.profiles?.full_name} | {doubt.profiles?.branch}, {doubt.profiles?.year}
                              </span>
                            </div>
                            <Dialog
                              open={isHelpModalOpen && selectedDoubtId === doubt.id}
                              onOpenChange={(open) => {
                                setIsHelpModalOpen(open)
                                if (!open) setSelectedDoubtId(null)
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={() => setSelectedDoubtId(doubt.id)}
                                >
                                  <Flame className="w-4 h-4 mr-2" />
                                  Offer to Help
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>How would you like to help?</DialogTitle>
                                </DialogHeader>
                                <div className="flex space-x-4">
                                  <Button
                                    className="flex-1 flex items-center justify-center space-x-2"
                                    onClick={() => handleOfferHelp(doubt.id, "text")}
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Text Chat</span>
                                  </Button>
                                  <Button
                                    className="flex-1 flex items-center justify-center space-x-2"
                                    onClick={() => handleOfferHelp(doubt.id, "video")}
                                  >
                                    <Video className="w-4 h-4" />
                                    <span>Video Call</span>
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Leaderboard Sidebar */}
                <div className="lg:w-80">
                  <Card className="bg-card border-border sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-foreground flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">🏆</span>
                        </div>
                        <span>Top Mentors</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {leaderboard.map((mentor, index) => (
                          <div
                            key={mentor.id}
                            className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0
                                  ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                                  : index === 1
                                    ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                                    : index === 2
                                      ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                      : "bg-muted-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{mentor.full_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {mentor.branch} • {mentor.total_points?.toLocaleString() || 0} pts
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Active Help Sessions</h2>
                <div className="grid gap-4">
                  {activeSessions.map((session) => (
                    <Card key={session.id} className="bg-card border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{session.doubt_threads?.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <Badge variant={session.status === "active" ? "default" : "secondary"}>
                              {session.status}
                            </Badge>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              {session.session_type === "video" ? (
                                <Video className="w-3 h-3" />
                              ) : (
                                <MessageCircle className="w-3 h-3" />
                              )}
                              <span>{session.session_type}</span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {session.helper_profile?.full_name} helping {session.doubt_threads?.profiles?.full_name}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="flex items-center space-x-1 bg-transparent">
                            <Eye className="w-4 h-4" />
                            <span>Watch</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {activeSessions.length === 0 && (
                    <Card className="bg-card border-border">
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No active sessions at the moment.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Top Contributors</h2>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {leaderboard.map((mentor, index) => (
                        <div
                          key={mentor.id}
                          className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                        >
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                                : index === 1
                                  ? "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800"
                                  : index === 2
                                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-lg font-medium text-foreground">{mentor.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {mentor.branch} • {mentor.total_points?.toLocaleString() || 0} points earned
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
