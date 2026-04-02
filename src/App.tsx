import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Plus, 
  Search, 
  LogOut, 
  LogIn,
  MapPin,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  TrendingUp,
  BarChart as BarChartIcon,
  ChevronLeft,
  Menu,
  Edit2,
  FileText,
  Download,
  LifeBuoy,
  ShieldCheck,
  Trash2,
  Clock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { format, startOfWeek, addDays, isFriday, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Types
interface Student {
  id: string;
  studentId: string;
  name: string;
  district: string;
  centre: string;
  skill: string;
  createdAt: any;
  modulesRequired: number;
  activeModules: number;
  modulesCompleted: number;
}

interface Attendance {
  id: string;
  studentId: string;
  centre: string;
  date: string;
  isPresent: boolean;
}

interface Centre {
  id: string;
  name: string;
  district: string;
}

const DISTRICTS = [
  "Balaka", "Blantyre", "Chikwawa", "Chiradzulu", "Chitipa", "Dedza", "Dowa", "Karonga", 
  "Kasungu", "Likoma", "Lilongwe", "Machinga", "Mangochi", "Mchinji", "Mulanje", "Mwanza", 
  "Mzimba", "Neno", "Nkhata Bay", "Nkhotakota", "Nsanje", "Ntcheu", "Ntchisi", "Phalombe", 
  "Rumphi", "Salima", "Thyolo", "Zomba"
];

const SKILLS = [
  "Motorcycle repair", "Welding and fabrication", "Electrical installations", "Plumbing", 
  "Bricklaying", "ICT", "Others"
];

const HeroClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-1">
        <CalendarCheck className="w-3 h-3" />
        {format(time, 'EEEE, MMMM dd, yyyy')}
      </div>
      <div className="text-5xl font-black text-gray-900 tracking-tighter flex items-baseline gap-1">
        <span>{format(time, 'HH:mm')}</span>
        <span className="text-3xl text-gray-300 font-light tracking-normal">:</span>
        <span className="text-3xl text-gray-400 font-bold">{format(time, 'ss')}</span>
      </div>
    </div>
  );
};

const SmallClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 text-gray-900 font-mono font-bold text-lg tracking-wider">
        <Clock className="w-4 h-4 text-blue-600" />
        {format(time, 'HH:mm:ss')}
      </div>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
        {format(time, 'EEEE, MMMM dd, yyyy')}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'attendance'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);

  // Form states
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isVerifyingEdit, setIsVerifyingEdit] = useState(false);
  const [isVerifyingDelete, setIsVerifyingDelete] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [editCode, setEditCode] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [editError, setEditError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [newStudent, setNewStudent] = useState({ 
    studentId: '', 
    name: '', 
    district: '', 
    centre: '', 
    skill: '',
    modulesRequired: 0,
    activeModules: 0,
    modulesCompleted: 0
  });
  const [attendanceDate, setAttendanceDate] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day >= 5 ? day - 5 : day + 2;
    const lastFriday = addDays(today, -diff);
    return format(lastFriday, 'yyyy-MM-dd');
  });
  const [selectedCentre, setSelectedCentre] = useState('');
  const [attendanceList, setAttendanceList] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Local Storage Keys
  const STORAGE_KEYS = {
    USER: 'ssms_user',
    STUDENTS: 'ssms_students',
    ATTENDANCE: 'ssms_attendance',
    CENTRES: 'ssms_centres'
  };

  useEffect(() => {
    // Load initial data from localStorage
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (savedStudents) setStudents(JSON.parse(savedStudents));

    const savedAttendance = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (savedAttendance) setAttendance(JSON.parse(savedAttendance));

    const savedCentres = localStorage.getItem(STORAGE_KEYS.CENTRES);
    if (savedCentres) {
      setCentres(JSON.parse(savedCentres));
    } else {
      // Default centres if none exist
      const initialCentres: Centre[] = [
        { id: '1', name: 'Lilongwe Central', district: 'Lilongwe' },
        { id: '2', name: 'Blantyre West', district: 'Blantyre' },
        { id: '3', name: 'Mzuzu North', district: 'Mzimba' },
        { id: '4', name: 'Zomba East', district: 'Zomba' }
      ];
      setCentres(initialCentres);
      localStorage.setItem(STORAGE_KEYS.CENTRES, JSON.stringify(initialCentres));
    }

    setLoading(false);
  }, []);

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseInt(loginCode);
    
    if (isNaN(code)) {
      setLoginError("Invalid access code.");
      return;
    }

    if (code >= 102 && code <= 270 && code % 6 === 0) {
      const newUser = {
        uid: `user_${code}`,
        displayName: `Admin ${code}`,
        email: `admin${code}@ssms.mw`,
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${code}`,
        isGuest: true
      };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
      setLoginError('');
    } else {
      setLoginError("Invalid access code.");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  const handleEditRequest = (student: Student) => {
    setEditingStudent(student);
    setIsVerifyingEdit(true);
    setEditCode('');
    setEditError('');
  };

  const handleVerifyEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseInt(editCode);
    if (code >= 102 && code <= 270 && code % 6 === 0) {
      setIsVerifyingEdit(false);
      setIsEditingStudent(true);
      setEditError('');
    } else {
      setEditError("Invalid access code.");
    }
  };

  const handleDeleteRequest = (student: Student) => {
    setStudentToDelete(student);
    setIsVerifyingDelete(true);
    setDeleteCode('');
    setDeleteError('');
  };

  const handleVerifyDelete = (e: React.FormEvent) => {
    e.preventDefault();
    const code = parseInt(deleteCode);
    if (code >= 102 && code <= 270 && code % 6 === 0) {
      if (studentToDelete) {
        const updatedStudents = students.filter(s => s.id !== studentToDelete.id);
        setStudents(updatedStudents);
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
        
        // Clean up attendance
        const updatedAttendance = attendance.filter(a => a.studentId !== studentToDelete.id);
        setAttendance(updatedAttendance);
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));
      }
      setIsVerifyingDelete(false);
      setStudentToDelete(null);
      setDeleteCode('');
      setDeleteError('');
    } else {
      setDeleteError("Invalid access code.");
    }
  };

  const handleUpdateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const updatedStudents = students.map(s => 
      s.id === editingStudent.id ? editingStudent : s
    );
    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    setIsEditingStudent(false);
    setEditingStudent(null);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = format(new Date(), 'MMMM dd, yyyy');

    // Header
    doc.setFillColor(59, 130, 246); // Blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('STEP UP', 15, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('COMPREHENSIVE NATIONAL REPORT - MALAWI', 15, 28);
    doc.text(`Generated on: ${dateStr}`, pageWidth - 15, 28, { align: 'right' });

    // Summary Section
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Executive Summary', 15, 55);

    const nationalRequired = students.reduce((acc, s) => acc + (s.modulesRequired || 0), 0);
    const nationalCompleted = students.reduce((acc, s) => acc + (s.modulesCompleted || 0), 0);
    const nationalRemaining = Math.max(0, nationalRequired - nationalCompleted);

    autoTable(doc, {
      startY: 60,
      head: [['Metric', 'Value', 'Context']],
      body: [
        ['Total Enrolled Students', stats.totalStudents.toString(), 'Country-wide enrollment'],
        ['Weekly Attendance Rate', `${stats.attendancePercentage}%`, `For Friday, ${format(parseISO(attendanceDate), 'MMM dd')}`],
        ['Total Modules Required', nationalRequired.toString(), 'National curriculum target'],
        ['Total Modules Completed', nationalCompleted.toString(), 'National progress achieved'],
        ['Remaining Modules', nationalRemaining.toString(), 'Updated required modules (Req - Comp)'],
        ['Total Districts Active', stats.districtData.length.toString(), 'Out of 28 districts']
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // District Breakdown
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. District-wise Distribution & Module Progress', 15, (doc as any).lastAutoTable.finalY + 15);

    const districtRows = stats.districtData.map(d => {
      const districtStudents = students.filter(s => s.district === d.name);
      const req = districtStudents.reduce((acc, s) => acc + (s.modulesRequired || 0), 0);
      const comp = districtStudents.reduce((acc, s) => acc + (s.modulesCompleted || 0), 0);
      const rem = Math.max(0, req - comp);
      
      return [
        d.name,
        d.centres.length.toString(),
        d.centres.reduce((acc, c) => acc + c.studentCount, 0).toString(),
        req.toString(),
        comp.toString(),
        rem.toString()
      ];
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['District', 'Centres', 'Students', 'Req. Modules', 'Comp. Modules', 'Remaining']],
      body: districtRows,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105] },
      styles: { fontSize: 8 }
    });

    // Student Directory (Top 50 or filtered)
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Student Directory (Complete List)', 15, 20);

    const studentRows = students.map(s => [
      s.studentId,
      s.name,
      s.district,
      s.centre,
      s.skill,
      s.modulesRequired.toString(),
      s.activeModules.toString(),
      s.modulesCompleted.toString()
    ]);

    autoTable(doc, {
      startY: 25,
      head: [['ID', 'Name', 'District', 'Centre', 'Skill', 'Req.', 'Active', 'Comp.']],
      body: studentRows,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 7 }
    });

    // Attendance History (Monthly District Overview)
    if (attendance.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Monthly District Attendance Overview', 15, 20);

      // Group attendance by month and district
      const monthlyData: Record<string, Record<string, { present: number, total: number }>> = {};
      
      attendance.forEach(record => {
        const date = parseISO(record.date);
        const monthKey = format(date, 'MMMM yyyy');
        const student = students.find(s => s.id === record.studentId);
        const district = student?.district || 'Unknown';

        if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
        if (!monthlyData[monthKey][district]) monthlyData[monthKey][district] = { present: 0, total: 0 };
        
        monthlyData[monthKey][district].total++;
        if (record.isPresent) monthlyData[monthKey][district].present++;
      });

      // Prepare table rows
      const attendanceRows: any[] = [];
      const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        return parseISO(format(parseISO(`01 ${a}`), 'yyyy-MM-dd')).getTime() - 
               parseISO(format(parseISO(`01 ${b}`), 'yyyy-MM-dd')).getTime();
      }).reverse();

      sortedMonths.forEach(month => {
        Object.entries(monthlyData[month]).forEach(([district, data]) => {
          const percentage = Math.round((data.present / data.total) * 100);
          attendanceRows.push([
            month,
            district,
            data.total.toString(),
            `${percentage}%`
          ]);
        });
      });

      autoTable(doc, {
        startY: 25,
        head: [['Month', 'District', 'Total Records', 'Attendance Rate']],
        body: attendanceRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110] }, // Teal-700
        styles: { fontSize: 9 },
        rowPageBreak: 'avoid'
      });
    }

    // Footer on all pages
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} of ${pageCount} - STEP UP Malawi`, pageWidth / 2, 287, { align: 'center' });
    }

    doc.save(`SSMS_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.studentId || !newStudent.name || !newStudent.district || !newStudent.centre || !newStudent.skill) return;

    const student: Student = {
      id: Math.random().toString(36).substr(2, 9),
      ...newStudent,
      createdAt: new Date().toISOString()
    };

    const updatedStudents = [...students, student];
    setStudents(updatedStudents);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
    
    setNewStudent({ 
      studentId: '', 
      name: '', 
      district: '', 
      centre: '', 
      skill: '',
      modulesRequired: 0,
      activeModules: 0,
      modulesCompleted: 0
    });
    setIsAddingStudent(false);
  };

  const handleAddAttendance = async () => {
    if (!selectedCentre || !attendanceDate) return;
    
    const dateObj = parseISO(attendanceDate);
    if (!isFriday(dateObj)) {
      alert("Attendance can only be recorded for Fridays!");
      return;
    }

    const batch = students.filter(s => s.centre === selectedCentre);
    const newRecords: Attendance[] = batch.map(student => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: student.id,
      centre: selectedCentre,
      date: attendanceDate,
      isPresent: attendanceList[student.id] ?? true
    }));

    const updatedAttendance = [...attendance, ...newRecords];
    setAttendance(updatedAttendance);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updatedAttendance));

    setIsAddingAttendance(false);
    setAttendanceList({});
    setSelectedCentre('');
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lowerSearch = searchTerm.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(lowerSearch) ||
      s.studentId.toLowerCase().includes(lowerSearch) ||
      s.skill.toLowerCase().includes(lowerSearch) ||
      s.district.toLowerCase().includes(lowerSearch) ||
      s.centre.toLowerCase().includes(lowerSearch) ||
      s.modulesRequired.toString().includes(lowerSearch) ||
      s.activeModules.toString().includes(lowerSearch) ||
      s.modulesCompleted.toString().includes(lowerSearch)
    );
  }, [students, searchTerm]);

  const stats = useMemo(() => {
    const totalStudents = students.length;
    const recentAttendance = attendance.filter(a => a.date === attendanceDate);
    const presentCount = recentAttendance.filter(a => a.isPresent).length;
    const totalAttendanceRecords = recentAttendance.length;
    
    const attendancePercentage = totalAttendanceRecords > 0 
      ? Math.round((presentCount / totalAttendanceRecords) * 100) 
      : 0;

    const countryWidePresent = attendance.filter(a => a.isPresent).length;
    const countryWideTotal = attendance.length;
    const countryWidePercentage = countryWideTotal > 0 
      ? Math.round((countryWidePresent / countryWideTotal) * 100) 
      : 0;

    const districtData = DISTRICTS.map(d => {
      const districtCentres = Array.from(new Set(students.filter(s => s.district === d).map(s => s.centre)));
      return {
        name: d,
        centres: districtCentres.map(c => ({
          name: c,
          studentCount: students.filter(s => s.district === d && s.centre === c).length
        }))
      };
    }).filter(d => d.centres.length > 0);

    return {
      totalStudents,
      attendancePercentage,
      countryWidePercentage,
      districtData
    };
  }, [students, attendance, attendanceDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">STEP UP</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">A comprehensive management system for students in Malawi, tracking district centres, skills, and weekly attendance.</p>
          
          <form onSubmit={handleCodeLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Code</label>
              <input 
                type="text" 
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all text-center font-mono tracking-widest"
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-[10px] font-bold text-center animate-pulse">{loginError}</p>
            )}
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-100"
            >
              Verify & Enter
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Secure Access | Data Protected</span>
            </div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              © {new Date().getFullYear()} STEP UP. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 240 }}
        className="bg-white border-r border-gray-200 flex flex-col fixed h-full z-20 transition-all duration-300"
      >
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8 px-2">
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-bold tracking-tighter text-gray-900 whitespace-nowrap">STEP UP</span>
                </motion.div>
              )}
              {isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 mx-auto"
                >
                  <GraduationCap className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {!isSidebarCollapsed && (
              <button 
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(false)}
              className="mb-8 p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors mx-auto"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          
          <nav className="space-y-1">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'students', icon: Users, label: 'Students' },
              { id: 'attendance', icon: CalendarCheck, label: 'Attendance' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200",
                  isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-3",
                  activeTab === item.id ? "bg-blue-50 text-blue-600 shadow-sm" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
            
            <button 
              onClick={generatePDFReport}
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all duration-200 mt-4",
                isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-3"
              )}
              title={isSidebarCollapsed ? "Generate PDF Report" : undefined}
            >
              <FileText className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Generate Report</span>}
            </button>
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <a 
              href="mailto:Chinseualbert@gmail.com?subject=system%20support&body=Hello...I'm%20looking%20for%20help%20on%20the%20system%20on%20the%20following"
              className={cn(
                "w-full flex items-center rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-all duration-200 mb-4",
                isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5"
              )}
              title={isSidebarCollapsed ? "System Support" : undefined}
            >
              <LifeBuoy className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>System Support</span>}
            </a>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className={cn(
                "w-full flex items-center rounded-2xl text-sm font-bold transition-all duration-300 relative group overflow-hidden",
                isSidebarCollapsed 
                  ? "justify-center p-3 text-red-500 hover:bg-red-50" 
                  : "gap-3 px-4 py-3 text-red-600 border border-red-100 bg-white hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm hover:shadow-lg hover:shadow-red-100"
              )}
              title={isSidebarCollapsed ? "Sign Out" : undefined}
            >
              <LogOut className={cn("w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5", !isSidebarCollapsed && "group-hover:scale-110")} />
              {!isSidebarCollapsed && (
                <span className="tracking-tight relative z-10">Sign Out</span>
              )}
              {!isSidebarCollapsed && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        animate={{ marginLeft: isSidebarCollapsed ? 80 : 240 }}
        className="flex-1 p-6 transition-all duration-300"
      >
        <header className={cn(
          "flex items-center mb-12",
          activeTab === 'dashboard' ? "flex-col justify-center text-center gap-6" : "justify-between"
        )}>
          <div>
            {activeTab === 'dashboard' ? (
              <HeroClock />
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {activeTab === 'students' && 'Student Directory'}
                  {activeTab === 'attendance' && 'Attendance Tracking'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {activeTab === 'students' && 'Manage and enroll new students across centres'}
                  {activeTab === 'attendance' && 'Record and analyze weekly Friday attendance'}
                </p>
              </>
            )}
          </div>
          
          <div className={cn(
            "flex items-center gap-6",
            activeTab === 'dashboard' && "flex-col"
          )}>
            {activeTab !== 'dashboard' && <SmallClock />}
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-10 h-6 bg-[#CE1126] relative overflow-hidden rounded-sm shadow-sm">
                <div className="h-1/3 bg-black"></div>
                <div className="h-1/3 bg-[#CE1126]"></div>
                <div className="h-1/3 bg-[#007A33]"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="w-4 h-4 rounded-full border border-white"></div>
                </div>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Malawi</span>
                <span className="text-sm font-black text-gray-900">{stats.totalStudents} Registered Students</span>
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500"></div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Students</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.totalStudents}</h3>
                    <div className="mt-3 flex items-center gap-2 text-blue-600 text-xs font-medium">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Across all districts</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500"></div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Recent Attendance</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.attendancePercentage}%</h3>
                    <div className="mt-3 flex items-center gap-2 text-green-600 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Present this week</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110 duration-500"></div>
                  <div className="relative">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Country Presence</p>
                    <h3 className="text-3xl font-bold text-gray-900">{stats.countryWidePercentage}%</h3>
                    <div className="mt-3 flex items-center gap-2 text-purple-600 text-xs font-medium">
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>National average</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* District Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <BarChartIcon className="w-4 h-4 text-blue-600" />
                    District Student Distribution
                  </h4>
                  <div className="overflow-x-auto custom-scrollbar">
                    <div className="h-[300px] min-w-[800px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.districtData.map(d => ({ 
                          name: d.name, 
                          total: d.centres.reduce((acc, c) => acc + c.studentCount, 0) 
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} dy={10} interval={0} angle={-45} textAnchor="end" height={60} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} />
                          <Tooltip 
                            cursor={{ fill: '#F8FAFC' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '12px' }}
                          />
                          <Bar dataKey="total" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Centres by District
                  </h4>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {stats.districtData.map((district, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-gray-900">{district.name}</h5>
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {district.centres.length} Centres
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {district.centres.map((centre, cIdx) => (
                            <div key={cIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors group">
                              <span className="text-xs font-medium text-gray-700">{centre.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-blue-600">{centre.studentCount}</span>
                                <span className="text-[10px] text-gray-400 uppercase">students</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {stats.districtData.length === 0 && (
                      <div className="text-center py-20">
                        <p className="text-gray-400">No data available yet. Start by adding students.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by Name, ID, Skill, District, Centre or Modules..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingStudent(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg shadow-blue-100"
                >
                  <Plus className="w-5 h-5" />
                  Add Student
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Student ID</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Student Name</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">District</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Centre</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Skill</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Modules (R/A/C)</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="font-bold text-gray-900">#{student.studentId}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </td>
                        <td className="px-8 py-5 text-sm text-gray-600">{student.district}</td>
                        <td className="px-8 py-5 text-sm text-gray-600">{student.centre}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                            {student.skill}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-sm font-bold">
                            <span className="text-gray-400" title="Required">{student.modulesRequired || 0}</span>
                            <span className="text-blue-600" title="Active">{student.activeModules || 0}</span>
                            <span className="text-green-600" title="Completed">{student.modulesCompleted || 0}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">Active</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditRequest(student)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteRequest(student)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-8 py-20 text-center text-gray-400">
                          No students found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div 
              key="attendance"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Friday</label>
                  <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  {!isFriday(parseISO(attendanceDate)) && (
                    <p className="text-red-500 text-[10px] mt-2 font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Must be a Friday
                    </p>
                  )}
                </div>
                
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-end">
                  <button 
                    onClick={() => setIsAddingAttendance(true)}
                    disabled={!isFriday(parseISO(attendanceDate))}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-blue-100"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    Record Attendance
                  </button>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Weekly Average</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{stats.attendancePercentage}%</span>
                    <span className="text-sm text-green-500 font-bold">+2.4%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="text-xl font-bold text-gray-900">Recent Records</h4>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold">Present</span>
                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">Absent</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Centre</th>
                        <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {attendance.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-5 text-sm font-medium text-gray-900">
                            {format(parseISO(record.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-8 py-5 text-sm text-gray-600">
                            {students.find(s => s.id === record.studentId)?.name || 'Unknown'} (#{students.find(s => s.id === record.studentId)?.studentId || 'N/A'})
                          </td>
                          <td className="px-8 py-5 text-sm text-gray-600">{record.centre}</td>
                          <td className="px-8 py-5">
                            {record.isPresent ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-sm font-bold">Present</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-red-600">
                                <XCircle className="w-4 h-4" />
                                <span className="text-sm font-bold">Absent</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {attendance.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center text-gray-400">
                            No attendance records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 pb-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure System | Data Protected</span>
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              © {new Date().getFullYear()} STEP UP. All rights reserved.
            </p>
          </div>
        </footer>
      </motion.main>

      {/* Modals */}
      <AnimatePresence>
        {isAddingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">New Student Enrollment</h3>
                <button onClick={() => setIsAddingStudent(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student ID Number</label>
                      <input 
                        required
                        type="text" 
                        value={newStudent.studentId}
                        onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })}
                        placeholder="e.g. STU-2024-001"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                        placeholder="e.g. John Phiri"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">District</label>
                      <select 
                        required
                        value={newStudent.district}
                        onChange={(e) => setNewStudent({ ...newStudent, district: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select District</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Centre</label>
                      <input 
                        required
                        type="text" 
                        value={newStudent.centre}
                        onChange={(e) => setNewStudent({ ...newStudent, centre: e.target.value })}
                        placeholder="Centre Name"
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skill / Course</label>
                    <select 
                      required
                      value={newStudent.skill}
                      onChange={(e) => setNewStudent({ ...newStudent, skill: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Skill</option>
                      {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Required</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newStudent.modulesRequired}
                        onChange={(e) => setNewStudent({ ...newStudent, modulesRequired: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newStudent.activeModules}
                        onChange={(e) => setNewStudent({ ...newStudent, activeModules: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Completed</label>
                      <input 
                        type="number" 
                        min="0"
                        value={newStudent.modulesCompleted}
                        onChange={(e) => setNewStudent({ ...newStudent, modulesCompleted: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 mt-4"
                >
                  Enroll Student
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isVerifyingEdit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Authorization Required</h3>
              <p className="text-sm text-gray-500 mb-6">Enter your access code to modify student data.</p>
              
              <form onSubmit={handleVerifyEdit} className="space-y-4">
                <input 
                  type="text" 
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 text-center font-mono tracking-widest"
                />
                {editError && <p className="text-red-500 text-[10px] font-bold">{editError}</p>}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsVerifyingEdit(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isVerifyingDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-sm text-gray-500 mb-6">Enter your access code to delete <b>{studentToDelete?.name}</b> from the directory.</p>
              
              <form onSubmit={handleVerifyDelete} className="space-y-4">
                <input 
                  type="text" 
                  value={deleteCode}
                  onChange={(e) => setDeleteCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-red-500 text-center font-mono tracking-widest"
                />
                {deleteError && <p className="text-red-500 text-[10px] font-bold">{deleteError}</p>}
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsVerifyingDelete(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-100"
                  >
                    Delete
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingStudent && editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Edit Student Data</h3>
                <button onClick={() => setIsEditingStudent(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleUpdateStudent} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student ID Number</label>
                      <input 
                        required
                        type="text" 
                        value={editingStudent.studentId}
                        onChange={(e) => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={editingStudent.name}
                        onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">District</label>
                      <select 
                        required
                        value={editingStudent.district}
                        onChange={(e) => setEditingStudent({ ...editingStudent, district: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select District</option>
                        {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Centre</label>
                      <input 
                        required
                        type="text" 
                        value={editingStudent.centre}
                        onChange={(e) => setEditingStudent({ ...editingStudent, centre: e.target.value })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skill / Course</label>
                    <select 
                      required
                      value={editingStudent.skill}
                      onChange={(e) => setEditingStudent({ ...editingStudent, skill: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Skill</option>
                      {SKILLS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Required</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editingStudent.modulesRequired || 0}
                        onChange={(e) => setEditingStudent({ ...editingStudent, modulesRequired: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Active</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editingStudent.activeModules || 0}
                        onChange={(e) => setEditingStudent({ ...editingStudent, activeModules: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Completed</label>
                      <input 
                        type="number" 
                        min="0"
                        value={editingStudent.modulesCompleted || 0}
                        onChange={(e) => setEditingStudent({ ...editingStudent, modulesCompleted: parseInt(e.target.value) || 0 })}
                        className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 mt-4"
                >
                  Update Student Data
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingAttendance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Record Attendance</h3>
                  <p className="text-sm text-gray-500 mt-1">Friday, {format(parseISO(attendanceDate), 'MMMM dd, yyyy')}</p>
                </div>
                <button onClick={() => setIsAddingAttendance(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select District Centre</label>
                  <select 
                    value={selectedCentre}
                    onChange={(e) => setSelectedCentre(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a centre...</option>
                    {Array.from(new Set(students.map(s => s.centre))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {selectedCentre && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-sm font-bold text-gray-900">Student List ({students.filter(s => s.centre === selectedCentre).length})</h5>
                      <p className="text-xs text-gray-400 italic">Uncheck if absent</p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {students.filter(s => s.centre === selectedCentre).map(student => (
                        <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                              {student.studentId.slice(-2)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{student.name}</p>
                              <p className="text-xs text-gray-400">#{student.studentId} • {student.skill}</p>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={attendanceList[student.id] ?? true}
                            onChange={(e) => setAttendanceList({ ...attendanceList, [student.id]: e.target.checked })}
                            className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={handleAddAttendance}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 mt-4"
                    >
                      Save Attendance Records
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }
      `}</style>
    </div>
  );
}
