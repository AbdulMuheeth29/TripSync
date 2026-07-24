import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Package, Plus, Sparkles, User, Trash2, CheckCircle2, Circle, Users } from 'lucide-react';
import { useState } from 'react';

interface PackingItem {
  id: string;
  name: string;
  assignedToUserId?: string | null;
  assignedTo?: { id: string; name: string };
  notes?: string | null;
  packed: boolean;
  category?: string;
}

interface TripMember {
  id: string;
  name: string;
}

interface PackingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  items: PackingItem[];
  members: TripMember[];
  onAddItem: (item: {
    name: string;
    assignedToUserId?: string;
    notes?: string;
    category?: string;
  }) => Promise<void>;
  onUpdateItem: (
    itemId: string,
    updates: { name?: string; assignedToUserId?: string; notes?: string; packed?: boolean }
  ) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onGenerateList?: () => Promise<void>;
  isGenerating?: boolean;
}

export function PackingListModal({
  isOpen,
  onClose,
  tripId,
  items,
  members,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onGenerateList,
  isGenerating = false,
}: PackingListModalProps) {
  const [newItem, setNewItem] = useState({
    name: '',
    assignedToUserId: '',
    notes: '',
    category: 'essentials',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', assignedToUserId: '', notes: '' });

  const categories = [
    { id: 'essentials', label: 'Essentials', icon: '📋' },
    { id: 'clothing', label: 'Clothing', icon: '👕' },
    { id: 'toiletries', label: 'Toiletries', icon: '🧴' },
    { id: 'electronics', label: 'Electronics', icon: '🔌' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'medication', label: 'Medication', icon: '💊' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎮' },
    { id: 'other', label: 'Other', icon: '📦' },
  ];

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;

    await onAddItem({
      name: newItem.name,
      assignedToUserId: newItem.assignedToUserId || undefined,
      notes: newItem.notes || undefined,
      category: newItem.category,
    });

    setNewItem({ name: '', assignedToUserId: '', notes: '', category: 'essentials' });
  };

  const handleStartEdit = (item: PackingItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      assignedToUserId: item.assignedToUserId || '',
      notes: item.notes || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    await onUpdateItem(editingId, {
      name: editForm.name,
      assignedToUserId: editForm.assignedToUserId || undefined,
      notes: editForm.notes || undefined,
    });

    setEditingId(null);
  };

  const handleTogglePacked = async (itemId: string, packed: boolean) => {
    await onUpdateItem(itemId, { packed });
  };

  const categorizedItems = categories
    .map((category) => ({
      ...category,
      items: items.filter((item) => (item.category || 'essentials') === category.id),
    }))
    .filter((cat) => cat.items.length > 0);

  const totalItems = items.length;
  const packedItems = items.filter((i) => i.packed).length;
  const progressPercent = totalItems > 0 ? (packedItems / totalItems) * 100 : 0;

  const unassignedItems = items.filter((i) => !i.assignedToUserId).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <DialogTitle>Packing List</DialogTitle>
          </div>
          <DialogDescription>Shared packing checklist for your trip</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-green-900">Packing Progress</p>
                <p className="text-xs text-green-700">
                  {packedItems} of {totalItems} items packed
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-700">{Math.round(progressPercent)}%</p>
              </div>
            </div>
            <Progress value={progressPercent} className="h-2" />

            {unassignedItems > 0 && (
              <div className="mt-3 flex items-center gap-2 p-2 bg-amber-100 rounded-lg">
                <Users className="h-4 w-4 text-amber-600" />
                <p className="text-xs text-amber-900">
                  {unassignedItems} item{unassignedItems !== 1 ? 's' : ''} not assigned yet
                </p>
              </div>
            )}
          </Card>

          {/* AI Generate */}
          {onGenerateList && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-900">AI-Powered Suggestions</p>
                  <p className="text-xs text-blue-700">
                    Let Atlas generate items based on your trip
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGenerateList}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Generate List'}
                </Button>
              </div>
            </Card>
          )}

          {/* Add New Item */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold mb-3">Add Item</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g., Sunscreen, Passport, Charger"
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newItem.category}
                  onValueChange={(value) => setNewItem((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select
                  value={newItem.assignedToUserId}
                  onValueChange={(value) =>
                    setNewItem((prev) => ({ ...prev, assignedToUserId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Input
                  placeholder="Size, quantity, etc."
                  value={newItem.notes}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <Button onClick={handleAddItem} disabled={!newItem.name.trim()} className="w-full mt-3">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Card>

          {/* Packing Items by Category */}
          {categorizedItems.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No items yet. Add your first item or generate a list with AI.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {categorizedItems.map((category) => (
                <Card key={category.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <h4 className="font-semibold">{category.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {category.items.filter((i) => i.packed).length}/{category.items.length}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          item.packed ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                        }`}
                      >
                        <Checkbox
                          checked={item.packed}
                          onCheckedChange={(checked) =>
                            handleTogglePacked(item.id, checked === true)
                          }
                        />

                        {editingId === item.id ? (
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((prev) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="Item name"
                            />
                            <Select
                              value={editForm.assignedToUserId}
                              onValueChange={(value) =>
                                setEditForm((prev) => ({ ...prev, assignedToUserId: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Assign to" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Unassigned</SelectItem>
                                {members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1">
                              <p
                                className={`text-sm font-medium ${item.packed ? 'line-through text-muted-foreground' : ''}`}
                              >
                                {item.name}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-muted-foreground italic">{item.notes}</p>
                              )}
                            </div>

                            {item.assignedTo ? (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 rounded text-xs">
                                <User className="h-3 w-3 text-blue-600" />
                                <span className="text-blue-900">{item.assignedTo.name}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Unassigned
                              </Badge>
                            )}

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(item)}
                              >
                                Edit
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost">
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove item?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Remove "{item.name}" from the packing list?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDeleteItem(item.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
