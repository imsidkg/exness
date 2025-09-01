import { motion } from "motion/react";
import { LogOut, User, Settings, Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface UserProfileProps {
  onLogout: () => void;
  userEmail?: string;
}

const UserProfile = ({ onLogout, userEmail }: UserProfileProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border-slate-200 hover:bg-white hover:border-purple-400 transition-colors"
          >
            <User className="h-5 w-5 text-purple-400" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-white/95 backdrop-blur-md border-slate-200"
      >
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <span className="font-normal text-slate-600">Signed in as</span>
          <span className="font-medium text-slate-900 truncate">
            {userEmail || "user@example.com"}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        
        <DropdownMenuItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
          <Settings className="mr-2 h-4 w-4 text-slate-600" />
          <span>Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer hover:bg-slate-100 focus:bg-slate-100">
          <Bell className="mr-2 h-4 w-4 text-slate-600" />
          <span>Notifications</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-200" />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 hover:bg-red-50 focus:bg-red-50"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfile;
