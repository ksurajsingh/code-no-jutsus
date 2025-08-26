"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, ExternalLink, Briefcase, Code, Award, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  user: any
  profile: any
  workExperience: any[]
  codingPlatforms: any[]
  skills: any[]
}

const branches = ["CSE", "ISE", "AIML", "CY", "DS", "ECE", "EIE", "EEE", "ETE"]
const platforms = ["leetcode", "github", "codechef", "hackerrank"]
const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"]

export default function ProfileForm({ user, profile, workExperience, codingPlatforms, skills }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  // Profile state
  const [profileData, setProfileData] = useState({
    full_name: profile?.full_name || "",
    branch: profile?.branch || "",
    year: profile?.year || 1,
    semester: profile?.semester || 1,
    cgpa: profile?.cgpa || "",
    current_status: profile?.current_status || "",
  })

  // Work experience state
  const [workExp, setWorkExp] = useState(workExperience)
  const [newWorkExp, setNewWorkExp] = useState({
    company_name: "",
    position: "",
    duration: "",
    description: "",
  })

  // Coding platforms state
  const [platforms_data, setPlatformsData] = useState(codingPlatforms)
  const [newPlatform, setNewPlatform] = useState({
    platform_name: "",
    username: "",
    profile_url: "",
  })

  // Skills state
  const [skillsData, setSkillsData] = useState(skills)
  const [newSkill, setNewSkill] = useState({
    skill_name: "",
    proficiency_level: "",
  })

  const supabase = createClient()

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.full_name,
          branch: profileData.branch,
          year: profileData.year,
          semester: profileData.semester,
          cgpa: profileData.cgpa ? Number.parseFloat(profileData.cgpa) : null,
          current_status: profileData.current_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addWorkExperience = async () => {
    if (!newWorkExp.company_name || !newWorkExp.position || !newWorkExp.duration) return

    try {
      const { data, error } = await supabase
        .from("work_experience")
        .insert({
          user_id: user.id,
          company_name: newWorkExp.company_name,
          position: newWorkExp.position,
          duration: newWorkExp.duration,
          description: newWorkExp.description,
        })
        .select()
        .single()

      if (error) throw error
      setWorkExp([...workExp, data])
      setNewWorkExp({ company_name: "", position: "", duration: "", description: "" })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const removeWorkExperience = async (id: string) => {
    try {
      const { error } = await supabase.from("work_experience").delete().eq("id", id)

      if (error) throw error
      setWorkExp(workExp.filter((exp) => exp.id !== id))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const addCodingPlatform = async () => {
    if (!newPlatform.platform_name || !newPlatform.username) return

    try {
      const { data, error } = await supabase
        .from("coding_platforms")
        .insert({
          user_id: user.id,
          platform_name: newPlatform.platform_name,
          username: newPlatform.username,
          profile_url: newPlatform.profile_url,
        })
        .select()
        .single()

      if (error) throw error
      setPlatformsData([...platforms_data, data])
      setNewPlatform({ platform_name: "", username: "", profile_url: "" })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const removeCodingPlatform = async (id: string) => {
    try {
      const { error } = await supabase.from("coding_platforms").delete().eq("id", id)

      if (error) throw error
      setPlatformsData(platforms_data.filter((platform) => platform.id !== id))
    } catch (error: any) {
      setError(error.message)
    }
  }

  const addSkill = async () => {
    if (!newSkill.skill_name || !newSkill.proficiency_level) return

    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          skill_name: newSkill.skill_name,
          proficiency_level: newSkill.proficiency_level,
        })
        .select()
        .single()

      if (error) throw error
      setSkillsData([...skillsData, data])
      setNewSkill({ skill_name: "", proficiency_level: "" })
    } catch (error: any) {
      setError(error.message)
    }
  }

  const removeSkill = async (id: string) => {
    try {
      const { error } = await supabase.from("skills").delete().eq("id", id)

      if (error) throw error
      setSkillsData(skillsData.filter((skill) => skill.id !== id))
    } catch (error: any) {
      setError(error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Basic Profile Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_status">Current Status</Label>
              <Input
                id="current_status"
                placeholder="e.g., Student, Intern, Job Seeker"
                value={profileData.current_status}
                onChange={(e) => setProfileData({ ...profileData, current_status: e.target.value })}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={profileData.branch}
                onValueChange={(value) => setProfileData({ ...profileData, branch: value })}
              >
                <SelectTrigger className="bg-background border-border">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="1"
                max="4"
                value={profileData.year}
                onChange={(e) => setProfileData({ ...profileData, year: Number.parseInt(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                min="1"
                max="8"
                value={profileData.semester}
                onChange={(e) => setProfileData({ ...profileData, semester: Number.parseInt(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cgpa">CGPA</Label>
              <Input
                id="cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="0.00"
                value={profileData.cgpa}
                onChange={(e) => setProfileData({ ...profileData, cgpa: e.target.value })}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Total Upvotes: <span className="font-medium text-foreground">{profile?.total_upvotes || 0}</span>
            </div>
            <Button
              onClick={handleProfileUpdate}
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
            >
              {isLoading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="w-5 h-5" />
            <span>Work Experience</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing work experience */}
          {workExp.map((exp) => (
            <div key={exp.id} className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">{exp.position}</h4>
                  <p className="text-sm text-muted-foreground">{exp.company_name}</p>
                  <p className="text-sm text-blue-400">{exp.duration}</p>
                  {exp.description && <p className="text-sm text-muted-foreground mt-2">{exp.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkExperience(exp.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Add new work experience */}
          <div className="p-4 rounded-lg border-2 border-dashed border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Company Name"
                value={newWorkExp.company_name}
                onChange={(e) => setNewWorkExp({ ...newWorkExp, company_name: e.target.value })}
                className="bg-background border-border"
              />
              <Input
                placeholder="Position"
                value={newWorkExp.position}
                onChange={(e) => setNewWorkExp({ ...newWorkExp, position: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="mb-4">
              <Input
                placeholder="Duration (e.g., 6 months, 2023-2024)"
                value={newWorkExp.duration}
                onChange={(e) => setNewWorkExp({ ...newWorkExp, duration: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="mb-4">
              <Textarea
                placeholder="Description (optional)"
                value={newWorkExp.description}
                onChange={(e) => setNewWorkExp({ ...newWorkExp, description: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <Button onClick={addWorkExperience} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Work Experience
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coding Platforms */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Coding Platforms</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms_data.map((platform) => (
              <div key={platform.id} className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="capitalize">
                        {platform.platform_name}
                      </Badge>
                      {platform.profile_url && (
                        <a
                          href={platform.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-foreground mt-1">@{platform.username}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCodingPlatform(platform.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new platform */}
          <div className="p-4 rounded-lg border-2 border-dashed border-border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Select
                value={newPlatform.platform_name}
                onValueChange={(value) => setNewPlatform({ ...newPlatform, platform_name: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platform}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Username"
                value={newPlatform.username}
                onChange={(e) => setNewPlatform({ ...newPlatform, username: e.target.value })}
                className="bg-background border-border"
              />
              <Input
                placeholder="Profile URL (optional)"
                value={newPlatform.profile_url}
                onChange={(e) => setNewPlatform({ ...newPlatform, profile_url: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <Button onClick={addCodingPlatform} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Platform
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Skills</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing skills */}
          <div className="flex flex-wrap gap-2">
            {skillsData.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center space-x-2 bg-muted/50 rounded-full px-3 py-1 border border-border"
              >
                <span className="text-sm text-foreground">{skill.skill_name}</span>
                <Badge variant="outline" className="text-xs">
                  {skill.proficiency_level}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSkill(skill.id)}
                  className="h-4 w-4 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new skill */}
          <div className="p-4 rounded-lg border-2 border-dashed border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Skill Name"
                value={newSkill.skill_name}
                onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                className="bg-background border-border"
              />
              <Select
                value={newSkill.proficiency_level}
                onValueChange={(value) => setNewSkill({ ...newSkill, proficiency_level: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Proficiency Level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addSkill} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={() => router.push("/dashboard")} className="border-border hover:bg-muted">
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
