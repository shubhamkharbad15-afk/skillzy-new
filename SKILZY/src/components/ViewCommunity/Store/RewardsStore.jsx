import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Store, 
  Star, 
  Award, 
  Palette,
  Crown,
  Sparkles,
  ShoppingCart,
  Coins
} from 'lucide-react';

const RewardsStore = () => {
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);
  const [storeItems, setStoreItems] = useState([]);
  const [userPurchases, setUserPurchases] = useState([]);

  useEffect(() => {
    loadStoreData();
  }, []);

  const loadStoreData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUserCredits(1250);
    setStoreItems([
      {
        id: 1,
        name: 'Professional Avatar Pack',
        description: 'Premium avatar options for your profile',
        price: 200,
        category: 'avatar',
        icon: '👤',
        rarity: 'common',
        available: true
      },
      {
        id: 2,
        name: 'Indigo Theme',
        description: 'Custom indigo color scheme for your profile',
        price: 150,
        category: 'theme',
        icon: '🎨',
        rarity: 'common',
        available: true
      },
      {
        id: 3,
        name: 'Gold Badge',
        description: 'Exclusive gold achievement badge',
        price: 500,
        category: 'badge',
        icon: '🏆',
        rarity: 'rare',
        available: true
      },
      {
        id: 4,
        name: 'Premium Crown',
        description: 'Royal crown for community leaders',
        price: 800,
        category: 'accessory',
        icon: '👑',
        rarity: 'epic',
        available: true
      },
      {
        id: 5,
        name: 'Rainbow Theme',
        description: 'Vibrant rainbow color scheme',
        price: 300,
        category: 'theme',
        icon: '🌈',
        rarity: 'uncommon',
        available: true
      },
      {
        id: 6,
        name: 'Diamond Frame',
        description: 'Elegant diamond border for profile',
        price: 600,
        category: 'frame',
        icon: '💎',
        rarity: 'rare',
        available: false
      }
    ]);
    setUserPurchases([1, 2, 5]); // User has already purchased items 1, 2, and 5
    setLoading(false);
  };

  const handlePurchase = async (item) => {
    if (userCredits < item.price) {
      alert('Insufficient credits!');
      return;
    }

    if (userPurchases.includes(item.id)) {
      alert('You already own this item!');
      return;
    }

    // Simulate purchase
    setUserCredits(prev => prev - item.price);
    setUserPurchases(prev => [...prev, item.id]);
    
    // Show success message
    alert(`Successfully purchased ${item.name}!`);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'uncommon': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'rare': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'epic': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getRarityIcon = (rarity) => {
    switch (rarity) {
      case 'rare': return <Star className="w-4 h-4" />;
      case 'epic': return <Crown className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Credits */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-500" />
            Rewards Store
          </h3>
          <p className="text-gray-500">Redeem your community points for exclusive items</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg">
          <Coins className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-indigo-700 dark:text-indigo-300">
            {userCredits.toLocaleString()} Credits
          </span>
        </div>
      </div>

      {/* Store Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {storeItems.map((item) => {
          const isOwned = userPurchases.includes(item.id);
          const canAfford = userCredits >= item.price;
          
          return (
            <Card key={item.id} className={`relative overflow-hidden transition-all hover:shadow-md ${
              isOwned ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''
            }`}>
              {isOwned && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-green-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Owned
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="text-4xl mb-2">{item.icon}</div>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <CardDescription className="text-sm">{item.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={getRarityColor(item.rarity)}>
                    {getRarityIcon(item.rarity)}
                    <span className="ml-1 capitalize">{item.rarity}</span>
                  </Badge>
                  <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
                    <Coins className="w-4 h-4" />
                    {item.price}
                  </div>
                </div>

                {!item.available && (
                  <div className="text-center">
                    <Badge variant="outline" className="border-red-500 text-red-500">
                      Out of Stock
                    </Badge>
                  </div>
                )}

                <Button
                  onClick={() => handlePurchase(item)}
                  disabled={isOwned || !item.available || !canAfford}
                  className={`w-full ${
                    isOwned 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : !canAfford 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Owned
                    </>
                  ) : !canAfford ? (
                    'Insufficient Credits'
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Purchase
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User's Purchased Items */}
      {userPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-500" />
              Your Collection
            </CardTitle>
            <CardDescription>Items you've purchased and can use</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userPurchases.map((itemId) => {
                const item = storeItems.find(i => i.id === itemId);
                if (!item) return null;
                
                return (
                  <div key={itemId} className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <Badge className="mt-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Active
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How to Earn Credits */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300">How to Earn Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">+</span>
              </div>
              <div>
                <div className="font-medium">Daily Activity</div>
                <div className="text-gray-600 dark:text-gray-400">10 credits per day</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">+</span>
              </div>
              <div>
                <div className="font-medium">Community Participation</div>
                <div className="text-gray-600 dark:text-gray-400">25 credits per post</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-bold">+</span>
              </div>
              <div>
                <div className="font-medium">Helping Others</div>
                <div className="text-gray-600 dark:text-gray-400">50 credits per help</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RewardsStore;
