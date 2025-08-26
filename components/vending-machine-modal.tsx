"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, Coffee, Book, Headphones, Gift, ShoppingCart } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/hooks/use-toast"

interface VendingItem {
  id: string
  name: string
  description: string
  cost: number
  icon: React.ReactNode
  category: "food" | "study" | "entertainment" | "gift"
  available: boolean
}

interface VendingMachineModalProps {
  isOpen: boolean
  onClose: () => void
  userPoints: number
  onPointsUpdate: (newPoints: number) => void
}

const vendingItems: VendingItem[] = [
  {
    id: "1",
    name: "Coffee Voucher",
    description: "Free coffee from campus cafeteria",
    cost: 25,
    icon: <Coffee className="h-6 w-6" />,
    category: "food",
    available: true,
  },
  {
    id: "2",
    name: "Study Guide",
    description: "Premium study materials for your subject",
    cost: 50,
    icon: <Book className="h-6 w-6" />,
    category: "study",
    available: true,
  },
  {
    id: "3",
    name: "Headphones",
    description: "Wireless earbuds for focused studying",
    cost: 200,
    icon: <Headphones className="h-6 w-6" />,
    category: "entertainment",
    available: true,
  },
  {
    id: "4",
    name: "Gift Card",
    description: "₹100 Amazon gift card",
    cost: 100,
    icon: <Gift className="h-6 w-6" />,
    category: "gift",
    available: true,
  },
]

export function VendingMachineModal({ isOpen, onClose, userPoints, onPointsUpdate }: VendingMachineModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [isRedeeming, setIsRedeeming] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const categories = [
    { id: "all", name: "All Items" },
    { id: "food", name: "Food & Drinks" },
    { id: "study", name: "Study Materials" },
    { id: "entertainment", name: "Entertainment" },
    { id: "gift", name: "Gift Cards" },
  ]

  const filteredItems =
    selectedCategory === "all" ? vendingItems : vendingItems.filter((item) => item.category === selectedCategory)

  const handleRedeem = async (item: VendingItem) => {
    if (userPoints < item.cost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${item.cost - userPoints} more points to redeem this item.`,
        variant: "destructive",
      })
      return
    }

    setIsRedeeming(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Deduct points from user
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ points: userPoints - item.cost })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Record the redemption
      const { error: redeemError } = await supabase.from("point_transactions").insert({
        user_id: user.id,
        type: "redemption",
        points: -item.cost,
        description: `Redeemed: ${item.name}`,
        metadata: { item_id: item.id, item_name: item.name },
      })

      if (redeemError) throw redeemError

      onPointsUpdate(userPoints - item.cost)
      toast({
        title: "Redemption Successful!",
        description: `You've successfully redeemed ${item.name}. Check your email for details.`,
      })
      onClose()
    } catch (error) {
      console.error("Redemption error:", error)
      toast({
        title: "Redemption Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Vending Machine
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            Your Points: <Badge variant="secondary">{userPoints}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {item.cost}
                    </Badge>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => handleRedeem(item)}
                    disabled={!item.available || userPoints < item.cost || isRedeeming}
                  >
                    {userPoints < item.cost ? "Insufficient Points" : "Redeem"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No items available in this category.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
