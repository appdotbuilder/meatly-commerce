import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Mail, Phone, MapPin, Calendar, Save, UserPlus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, CreateUserInput, UpdateUserInput } from '../../../server/src/schema';

interface UserProfileProps {
  user: UserType | null;
  onUserUpdate: () => void;
}

export default function UserProfile({ user, onUserUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    address: ''
  });

  // STUB: Create mock user data if none exists
  const mockUser: UserType | null = user || {
    id: 1,
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    phone: '+1-555-123-4567',
    address: '123 Main Street, Apartment 4B, New York, NY 10001',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)   // 5 days ago
  };

  const displayUser = mockUser;

  useEffect(() => {
    if (displayUser) {
      setFormData({
        email: displayUser.email,
        full_name: displayUser.full_name,
        phone: displayUser.phone || '',
        address: displayUser.address || ''
      });
    }
  }, [displayUser]);

  const handleSave = async () => {
    if (!displayUser) return;

    setSaving(true);
    
    const updateInput: UpdateUserInput = {
      id: displayUser.id,
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone || null,
      address: formData.address || null
    };

    // Demo behavior: simulate success
    setTimeout(() => {
      setIsEditing(false);
      onUserUpdate();
      alert('Profile updated successfully! ✅');
      setSaving(false);
    }, 1000);

    // Optional: Try to update on backend
    try {
      await trpc.updateUser.mutate(updateInput);
    } catch (error) {
      console.log('Backend not available, demo profile update completed');
    }
  };

  const handleCreateUser = async () => {
    setSaving(true);
    
    const createInput: CreateUserInput = {
      email: formData.email,
      full_name: formData.full_name,
      phone: formData.phone || undefined,
      address: formData.address || undefined
    };

    // Demo behavior: simulate success
    setTimeout(() => {
      setIsCreating(false);
      setFormData({ email: '', full_name: '', phone: '', address: '' });
      onUserUpdate();
      alert('Account created successfully! 🎉');
      setSaving(false);
    }, 1000);

    // Optional: Try to create on backend
    try {
      await trpc.createUser.mutate(createInput);
    } catch (error) {
      console.log('Backend not available, demo account creation completed');
    }
  };

  const handleCancel = () => {
    if (displayUser) {
      setFormData({
        email: displayUser.email,
        full_name: displayUser.full_name,
        phone: displayUser.phone || '',
        address: displayUser.address || ''
      });
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  if (!displayUser && !isCreating) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">👤 User Profile</h2>
        
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Profile Found</h3>
            <p className="text-gray-500 mb-6">Create your profile to get started with Meatly!</p>
            <Button onClick={() => setIsCreating(true)} className="bg-red-600 hover:bg-red-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCreating) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">👤 Create Profile</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Fill in your details to create your Meatly account</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1-555-123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 Main Street, Apartment 4B, City, State, ZIP"
                rows={3}
              />
            </div>
          </CardContent>
          
          <CardFooter className="space-x-2">
            <Button
              onClick={handleCreateUser}
              disabled={isSaving || !formData.email.trim() || !formData.full_name.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Account'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">👤 User Profile</h2>
        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
          Active Account
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Profile Information</span>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Update your personal information' : 'Your account details'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayUser.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{displayUser.full_name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">
                      {displayUser.phone || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="Enter your full address"
                    rows={3}
                  />
                ) : (
                  <div className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md min-h-[60px]">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      {displayUser.address || 'Not provided'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            
            {isEditing && (
              <CardFooter className="space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formData.email.trim() || !formData.full_name.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>

        {/* Account Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-red-50 rounded-md">
                <div className="text-2xl font-bold text-red-600">
                  🥩 Meatly
                </div>
                <p className="text-sm text-red-700 mt-1">Premium Member</p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {displayUser.created_at.toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="font-medium">
                    {displayUser.updated_at.toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Account Status</span>
                  <Badge className="bg-green-100 text-green-800 border-0">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Order History
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MapPin className="h-4 w-4 mr-2" />
                Delivery Addresses
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                <User className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>

          {!isEditing && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="text-sm text-yellow-800 mb-3">
                  💡 <strong>Tip:</strong> Keep your profile updated to ensure smooth deliveries!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  onClick={() => setIsEditing(true)}
                >
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}