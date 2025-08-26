import { supabase } from "path/to/supabase" // Import supabase
import { toast } from "react-toastify" // Import toast
import { doubts } from "path/to/doubts" // Import doubts
import { fetchDoubts } from "path/to/fetchDoubts" // Import fetchDoubts

const handleUpvote = async (doubtId: string) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upvote doubts.",
        variant: "destructive",
      })
      return
    }

    // Check if user already upvoted
    const { data: existingUpvote } = await supabase
      .from("doubt_upvotes")
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
    const { error: upvoteError } = await supabase.from("doubt_upvotes").insert({ doubt_id: doubtId, user_id: user.id })

    if (upvoteError) throw upvoteError

    // Get doubt author to award points
    const doubt = doubts.find((d) => d.id === doubtId)
    if (doubt) {
      const { error: pointsError } = await supabase.rpc("award_points", {
        user_id: doubt.author_id,
        points_to_add: 5,
        description: "Received upvote on doubt",
      })

      if (pointsError) {
        console.error("Error awarding points:", pointsError)
      }
    }

    // Refresh doubts to show updated upvote count
    fetchDoubts()

    toast({
      title: "Upvoted!",
      description: "You've successfully upvoted this doubt. The author earned 5 points!",
    })
  } catch (error) {
    console.error("Upvote error:", error)
    toast({
      title: "Upvote Failed",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    })
  }
}
