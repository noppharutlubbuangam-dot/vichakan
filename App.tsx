
import React, { useState, useMemo, useEffect } from 'react';
import { Section } from './components/Section';
import { Badge } from './components/Badge';
import type { Activity, Team, TeamMember, TeamStatus, Category } from './types';
import { CompetitionMode, FileType } from './types';

// IMPORTANT: Replace this placeholder with your deployed Google Apps Script Web App URL.
// The script will act as the backend, connecting to your Google Sheet.
// To create it:
// 1. In your Google Drive folder (ID: "1rqv8_Uh9SqmvLjsY--9CRwYRPYBCyjAD"), create a new Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Write functions to handle doGet() for fetching data and doPost() for adding teams.
// 4. Your script must handle CORS by returning appropriate headers.
// 5. Deploy the script as a Web App with access for "Anyone".
// 6. Paste the deployed Web App URL here.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxzw4WHTOjxO7CYItRJWaRo2TSVlMLSGidM-Tqob4dB39cYtIi48huNOuiQJrjcatl9/exec';

const App: React.FC = () => {
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // UI State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>('all');
  
  // Form State
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
      activityId: '',
      level: '',
      school: '',
      teamName: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      teachers: [] as TeamMember[],
      students: [] as TeamMember[],
  });
  
  // Fetch initial data from Google Sheets via Apps Script
  useEffect(() => {
    const fetchData = async () => {
      if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL') {
        setError('กรุณาตั้งค่า URL ของ Google Apps Script ในไฟล์ App.tsx');
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(SCRIPT_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Assuming the script returns data in this format: { categories: [], activities: [], teams: [] }
        setCategories(data.categories || []);
        setActivities(data.activities || []);
        setTeams(data.teams || []);
        setError(null);
      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาตรวจสอบว่า URL ของ Google Apps Script ถูกต้องและสคริปต์ทำงานได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedActivityForForm = activities.find(act => act.id === formData.activityId);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'activityId') {
      const activity = activities.find(act => act.id === value);
      if (activity) {
          setFormData(prev => ({
              ...prev,
              activityId: value,
              level: '', // Reset level when activity changes
              teachers: Array.from({ length: activity.teamComposition.teachers }, () => ({ fullName: '', detail: '' })),
              students: Array.from({ length: activity.teamComposition.students }, () => ({ fullName: '', detail: '' })),
          }));
      }
    }
  };

  const handleMemberChange = (type: 'teachers' | 'students', index: number, field: 'fullName' | 'detail', value: string) => {
      setFormData(prev => {
          const newMembers = [...prev[type]];
          newMembers[index] = { ...newMembers[index], [field]: value };
          return { ...prev, [type]: newMembers };
      });
  };

  const nextStep = () => setFormStep(s => s + 1);
  const prevStep = () => setFormStep(s => s - 1);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityForForm || submitting) return;

    setSubmitting(true);
    
    const newTeamPayload = {
        activityId: formData.activityId,
        teamName: formData.teamName,
        school: formData.school,
        level: formData.level,
        contact: {
            name: formData.contactName,
            phone: formData.contactPhone,
            email: formData.contactEmail,
        },
        teachers: formData.teachers,
        students: formData.students,
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain', // Apps Script can have issues with application/json from fetch
            },
            body: JSON.stringify({ action: 'addTeam', payload: newTeamPayload }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            setTeams(prev => [...prev, result.data]); // Add the new team returned from the server
            alert(`ส่งใบสมัครสำหรับทีม "${formData.teamName}" เรียบร้อยแล้ว!`);
            // Reset form
            setFormStep(1);
            setFormData({
                activityId: '', level: '', school: '', teamName: '',
                contactName: '', contactPhone: '', contactEmail: '',
                teachers: [], students: [],
            });
        } else {
            throw new Error(result.message || 'An error occurred on the server.');
        }
    } catch (error) {
        console.error('Submission failed:', error);
        alert('เกิดข้อผิดพลาดในการส่งใบสมัคร กรุณาลองใหม่อีกครั้ง');
    } finally {
        setSubmitting(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const categoryMatch = selectedCategory === 'all' || activity.categoryId === selectedCategory;
      const activityMatch = selectedActivityFilter === 'all' || activity.id === selectedActivityFilter;
      return categoryMatch && activityMatch;
    });
  }, [selectedCategory, selectedActivityFilter, activities]);

  const reportData = useMemo(() => {
    const summary: { [key: string]: { teams: number, teachers: number, students: number, total: number } } = {};
    
    teams.forEach(team => {
      const activity = activities.find(a => a.id === team.activityId);
      if (activity) {
        if (!summary[activity.name]) {
          summary[activity.name] = { teams: 0, teachers: 0, students: 0, total: 0 };
        }
        summary[activity.name].teams++;
        summary[activity.name].teachers += team.teachers.length;
        summary[activity.name].students += team.students.length;
        summary[activity.name].total += team.teachers.length + team.students.length;
      }
    });
    return summary;
  }, [teams, activities]);


  // Helper components
  const FormInput: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean, type?: string, placeholder?: string}> = ({ name, label, ...props }) => (
      <div>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <input id={name} name={name} {...props} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm" />
      </div>
  );

  const FormSelect: React.FC<{name: string, label: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, children: React.ReactNode, required?: boolean}> = ({ name, label, ...props }) => (
      <div>
          <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
          <select id={name} name={name} {...props} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md">
              {props.children}
          </select>
      </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-slate-600">กำลังโหลดข้อมูล...</div>;
  }
  
  if (error) {
    return <div className="flex flex-col justify-center items-center min-h-screen text-red-600 p-8 text-center bg-red-50">
      <h2 className="text-2xl font-bold mb-4">เกิดข้อผิดพลาด</h2>
      <p>{error}</p>
      <p className="mt-2 text-sm text-slate-500">โปรดตรวจสอบการตั้งค่า Google Apps Script และการเชื่อมต่ออินเทอร์เน็ต</p>
    </div>;
  }
  
  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-20">
      <main>
        {/* 1. Hero */}
        <div className="bg-white">
          <div className="w-full max-w-5xl mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">ระบบลงทะเบียนแข่งขัน</h1>
            <p className="mt-4 text-lg text-slate-600">ระดับสถานศึกษา ประจำปีการศึกษา 2567</p>
            <a href="#form-section" className="mt-8 inline-block bg-sky-500 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-sky-600 transition-colors duration-300">
              เริ่มลงทะเบียน
            </a>
          </div>
        </div>

        {/* 2. Filters */}
        <Section id="filters" title="ค้นหากิจกรรม">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect name="category" label="หมวดหมู่กิจกรรม" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">ทั้งหมด</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </FormSelect>
              <FormSelect name="activity" label="กิจกรรม" value={selectedActivityFilter} onChange={(e) => setSelectedActivityFilter(e.target.value)}>
                <option value="all">ทั้งหมด</option>
                {activities.filter(act => selectedCategory === 'all' || act.categoryId === selectedCategory).map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
              </FormSelect>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">เลือกหมวดหมู่เพื่อกรองรายการกิจกรรมที่สนใจ</p>
          </div>
        </Section>
        
        {/* 3. Activity Cards */}
        <Section id="activities" title="รายการแข่งขัน">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map(activity => (
                    <div key={activity.id} className="bg-white rounded-xl shadow-md border border-slate-200 p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                        <h3 className="text-xl font-bold text-slate-900">{activity.name}</h3>
                        <div className="mt-4 space-y-2 text-slate-600 text-sm">
                            <p><span className="font-semibold">ระดับ:</span> {activity.levels.join(', ')}</p>
                            <p><span className="font-semibold">โหมด:</span> {activity.mode}</p>
                            <p><span className="font-semibold">ประเภททีม:</span> ครู {activity.teamComposition.teachers} คน, นักเรียน {activity.teamComposition.students} คน</p>
                        </div>
                        <div className="mt-auto pt-6">
                           <a href="#form-section" onClick={() => handleFormChange({ target: { name: 'activityId', value: activity.id } } as any)} className="w-full text-center bg-sky-100 text-sky-700 font-semibold py-2 px-4 rounded-lg hover:bg-sky-200 transition-colors">
                              สมัครทีม
                           </a>
                        </div>
                    </div>
                ))}
            </div>
        </Section>
        
        {/* 4. Registration Form */}
        <Section id="form-section" title="ฟอร์มสมัครทีม">
            <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm border border-slate-200">
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  {[1, 2, 3].map(step => (
                    <div key={step} className={`w-1/3 text-center ${formStep >= step ? 'text-sky-600 font-semibold' : 'text-slate-400'}`}>
                      ขั้นตอนที่ {step}
                    </div>
                  ))}
                </div>
                <div className="mt-2 bg-slate-200 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(formStep - 1) * 50}%` }}></div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                  {formStep === 1 && (
                      <div className="space-y-4 animate-fadeIn">
                          <h3 className="text-lg font-semibold">1. ข้อมูลการแข่งขัน</h3>
                          <FormSelect name="activityId" label="กิจกรรมที่สมัคร" value={formData.activityId} onChange={handleFormChange} required>
                            <option value="">-- เลือกกิจกรรม --</option>
                            {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                          </FormSelect>
                          {selectedActivityForForm && (
                            <FormSelect name="level" label="ระดับที่สมัคร" value={formData.level} onChange={handleFormChange} required>
                                <option value="">-- เลือกระดับ --</option>
                                {selectedActivityForForm.levels.map(level => <option key={level} value={level}>{level}</option>)}
                            </FormSelect>
                          )}
                          <FormInput name="school" label="โรงเรียน" value={formData.school} onChange={handleFormChange} required placeholder="ชื่อโรงเรียน"/>
                          <FormInput name="teamName" label="ชื่อทีม (ถ้ามี)" value={formData.teamName} onChange={handleFormChange} placeholder="ชื่อทีม"/>
                          <div className="text-right">
                              <button type="button" onClick={nextStep} disabled={!formData.activityId || !formData.level || !formData.school} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed">ถัดไป</button>
                          </div>
                      </div>
                  )}

                  {formStep === 2 && (
                      <div className="space-y-4 animate-fadeIn">
                          <h3 className="text-lg font-semibold">2. ข้อมูลผู้ติดต่อหลัก</h3>
                          <FormInput name="contactName" label="ชื่อ-สกุล ผู้ติดต่อ" value={formData.contactName} onChange={handleFormChange} required placeholder="สมชาย ใจดี"/>
                          <FormInput name="contactPhone" label="เบอร์โทรศัพท์" type="tel" value={formData.contactPhone} onChange={handleFormChange} required placeholder="0812345678"/>
                          <FormInput name="contactEmail" label="อีเมล" type="email" value={formData.contactEmail} onChange={handleFormChange} required placeholder="contact@example.com"/>
                          <div className="flex justify-between">
                              <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300">ย้อนกลับ</button>
                              <button type="button" onClick={nextStep} disabled={!formData.contactName || !formData.contactPhone || !formData.contactEmail} className="bg-sky-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed">ถัดไป</button>
                          </div>
                      </div>
                  )}

                  {formStep === 3 && selectedActivityForForm && (
                      <div className="space-y-6 animate-fadeIn">
                          <h3 className="text-lg font-semibold">3. รายชื่อสมาชิกในทีม</h3>
                          <div>
                              <h4 className="font-semibold text-slate-800 mb-2">ครูผู้ควบคุมทีม ({selectedActivityForForm.teamComposition.teachers} คน)</h4>
                              <div className="space-y-4">
                                {formData.teachers.map((_, index) => (
                                    <div key={`teacher-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md">
                                        <FormInput name={`teacherName-${index}`} label={`ชื่อ-สกุล ครูคนที่ ${index+1}`} value={formData.teachers[index].fullName} onChange={e => handleMemberChange('teachers', index, 'fullName', e.target.value)} required/>
                                        <FormInput name={`teacherEmail-${index}`} label={`อีเมล ครูคนที่ ${index+1}`} type="email" value={formData.teachers[index].detail} onChange={e => handleMemberChange('teachers', index, 'detail', e.target.value)} required/>
                                    </div>
                                ))}
                              </div>
                          </div>
                          <div>
                              <h4 className="font-semibold text-slate-800 mb-2">นักเรียน ({selectedActivityForForm.teamComposition.students} คน)</h4>
                               <div className="space-y-4">
                                {formData.students.map((_, index) => (
                                    <div key={`student-${index}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-md">
                                        <FormInput name={`studentName-${index}`} label={`ชื่อ-สกุล นักเรียนคนที่ ${index+1}`} value={formData.students[index].fullName} onChange={e => handleMemberChange('students', index, 'fullName', e.target.value)} required/>
                                        <FormInput name={`studentClass-${index}`} label={`ชั้นเรียน นักเรียนคนที่ ${index+1}`} value={formData.students[index].detail} onChange={e => handleMemberChange('students', index, 'detail', e.target.value)} required/>
                                    </div>
                                ))}
                              </div>
                          </div>
                          <div className="flex justify-between">
                              <button type="button" onClick={prevStep} className="bg-slate-200 text-slate-700 font-bold py-2 px-6 rounded-lg hover:bg-slate-300">ย้อนกลับ</button>
                              <button type="submit" disabled={submitting} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-wait">
                                {submitting ? 'กำลังส่ง...' : 'ส่งใบสมัคร'}
                              </button>
                          </div>
                      </div>
                  )}
              </form>
              <p className="text-sm text-slate-500 mt-6 text-center">กรุณาตรวจสอบข้อมูลให้ถูกต้องครบถ้วนก่อนส่งใบสมัคร</p>
            </div>
        </Section>
        
        {/* 5. File Upload */}
        <Section id="upload" title="อัปโหลดเอกสาร">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <FormSelect name="fileType" label="ประเภทไฟล์" value="" onChange={() => {}}>
                    <option>-- เลือกประเภท --</option>
                    {Object.values(FileType).map(type => <option key={type} value={type}>{type}</option>)}
                </FormSelect>
                <div>
                    <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700">เลือกไฟล์</label>
                    <input id="file-upload" name="file-upload" type="file" className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100"/>
                </div>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">อัปโหลดไฟล์ที่จำเป็นสำหรับการสมัคร เช่น หนังสือยินยอมผู้ปกครอง หรือแฟ้มผลงาน</p>
          </div>
        </Section>
        
        {/* 6. Teams List */}
        <Section id="teams" title="รายชื่อทีมที่สมัคร">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                        <tr>
                            {['รหัสทีม', 'กิจกรรม', 'ชื่อทีม', 'ครู', 'นร.', 'ระดับ', 'สถานะ'].map(header => (
                                <th key={header} scope="col" className="px-6 py-3">{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map(team => {
                            const activity = activities.find(a => a.id === team.activityId);
                            return (
                                <tr key={team.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{team.id}</td>
                                    <td className="px-6 py-4">{activity?.name}</td>
                                    <td className="px-6 py-4 font-semibold">{team.teamName}</td>
                                    <td className="px-6 py-4">{team.teachers.length}/{activity?.teamComposition.teachers}</td>
                                    <td className="px-6 py-4">{team.students.length}/{activity?.teamComposition.students}</td>
                                    <td className="px-6 py-4">{team.level}</td>
                                    <td className="px-6 py-4"><Badge status={team.status} /></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">ตารางแสดงรายชื่อทีมทั้งหมดที่ลงทะเบียนเข้าร่วมการแข่งขัน</p>
        </Section>
        
        {/* 7. Edit Team UI Description */}
        <Section id="edit-info" title="การจัดการทีมและสมาชิก">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center text-slate-600">
              <h3 className="font-semibold text-lg text-slate-800">วิธีการแก้ไขข้อมูล</h3>
              <p className="mt-2">ผู้ดูแลระบบสามารถคลิกที่ปุ่ม "แก้ไข" ในแต่ละแถวของตารางทีม (ยังไม่แสดงในเวอร์ชันนี้) เพื่อเปิดหน้าต่างสำหรับแก้ไขข้อมูลทีม, เพิ่ม, แก้ไข หรือลบรายชื่อสมาชิกทีละคนได้</p>
            </div>
        </Section>
        
        {/* 8. Report */}
        <Section id="report" title="รายงานสรุป">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <h3 className="font-semibold text-lg text-slate-800 mb-4">สรุปจำนวนผู้สมัครตามกิจกรรม</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">กิจกรรม</th>
                                <th scope="col" className="px-6 py-3 text-center">จำนวนทีม</th>
                                <th scope="col" className="px-6 py-3 text-center">จำนวนครู</th>
                                <th scope="col" className="px-6 py-3 text-center">จำนวนนักเรียน</th>
                                <th scope="col" className="px-6 py-3 text-center">รวม</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(reportData).map(([activityName, data]) => (
                                <tr key={activityName} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{activityName}</td>
                                    <td className="px-6 py-4 text-center">{data.teams}</td>
                                    <td className="px-6 py-4 text-center">{data.teachers}</td>
                                    <td className="px-6 py-4 text-center">{data.students}</td>
                                    <td className="px-6 py-4 text-center font-bold">{data.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <p className="text-sm text-slate-500 mt-4 text-center">ข้อมูลสรุปเพื่อดูภาพรวมการลงทะเบียนในแต่ละกิจกรรม</p>
        </Section>

        {/* 10. Admin Description */}
        <Section id="admin-info" title="ส่วนสำหรับผู้ดูแลระบบ">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 text-center text-slate-600">
              <h3 className="font-semibold text-lg text-slate-800">การตรวจสอบเอกสาร</h3>
              <p className="mt-2">ผู้ดูแลระบบจะมีหน้าสำหรับตรวจสอบไฟล์ที่อัปโหลดโดยผู้สมัคร สามารถกด "อนุมัติ" หรือ "ไม่ผ่าน" พร้อมระบุหมายเหตุเพื่อแจ้งกลับไปยังผู้สมัครได้ สถานะของทีมจะอัปเดตตามการตรวจสอบนี้</p>
            </div>
        </Section>

      </main>

      {/* 9. Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-t-md md:hidden">
        <div className="flex justify-around">
            <a href="#" className="flex flex-col items-center justify-center p-3 text-sky-600 hover:bg-sky-50 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                <span className="text-xs">หน้าหลัก</span>
            </a>
            <a href="#form-section" className="flex flex-col items-center justify-center p-3 text-slate-500 hover:bg-sky-50 hover:text-sky-600 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                <span className="text-xs">สมัคร</span>
            </a>
             <a href="#teams" className="flex flex-col items-center justify-center p-3 text-slate-500 hover:bg-sky-50 hover:text-sky-600 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="text-xs">ทีม</span>
            </a>
            <a href="#report" className="flex flex-col items-center justify-center p-3 text-slate-500 hover:bg-sky-50 hover:text-sky-600 w-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <span className="text-xs">รายงาน</span>
            </a>
            <a href="#admin-info" className="flex flex-col items-center justify-center p-3 text-slate-500 hover:bg-sky-50 hover:text-sky-600 w-full">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-xs">ผู้ดูแล</span>
            </a>
        </div>
      </nav>
    </div>
  );
};

export default App;
