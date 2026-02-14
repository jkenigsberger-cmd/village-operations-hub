import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { Loader2, Settings as SettingsIcon, Download, Upload, RotateCcw, AlertTriangle, Check, Copy, FileJson, Users, Cloud, Database, Briefcase } from 'lucide-react';
import { HE } from '@/lib/translations';
import { importAllFromLocalStorage, hasLocalStorageData, clearLocalStorageData, ImportResult } from '@/lib/dataImport';

const Settings = () => {
  const navigate = useNavigate();
  const { state, isLoading, exportState, importState, resetToDefault } = useVillage();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cloud import state
  const [isImportingToCloud, setIsImportingToCloud] = useState(false);
  const [cloudImportResult, setCloudImportResult] = useState<ImportResult | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (isLoading || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const handleExport = () => {
    const json = exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aharonson-farm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleCopyToClipboard = () => {
    const json = exportState();
    navigator.clipboard.writeText(json);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(false);
    if (!importJson.trim()) {
      setImportError(HE.messages.pasteJson);
      return;
    }
    const success = importState(importJson.trim());
    if (success) {
      setImportSuccess(true);
      setImportJson('');
      setShowImportForm(false);
      setTimeout(() => setImportSuccess(false), 3000);
    } else {
      setImportError(HE.messages.invalidJson);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImportJson(e.target?.result as string);
    reader.readAsText(file);
  };

  // Import data from localStorage to Cloud
  const handleImportToCloud = async () => {
    setIsImportingToCloud(true);
    setCloudImportResult(null);
    
    try {
      const result = await importAllFromLocalStorage();
      setCloudImportResult(result);
      
      if (result.success) {
        setShowClearConfirm(true);
      }
    } catch (error) {
      setCloudImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsImportingToCloud(false);
    }
  };

  const handleClearLocalStorage = () => {
    clearLocalStorageData();
    setShowClearConfirm(false);
    setCloudImportResult({
      ...cloudImportResult!,
      message: cloudImportResult!.message + ' (נתונים מקומיים נמחקו)'
    });
  };

  const hasLocalData = hasLocalStorageData();

  const stats = {
    neighborhoods: Object.keys(state.neighborhoods).length,
    tents: Object.keys(state.tents).length,
    beds: Object.keys(state.beds).length,
    facilities: Object.keys(state.facilities).length,
    reservations: Object.keys(state.activityReservations).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border">
        <div className="container py-3 md:py-6">
          <BreadcrumbNav items={[{ label: HE.nav.settings }]} />
          <h1 className="text-2xl md:text-4xl font-bold flex items-center gap-2 md:gap-3">
            <SettingsIcon className="w-8 h-8 md:w-10 md:h-10" />
            {HE.pages.settingsData}
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg mt-1 md:mt-2">
            ייצוא, ייבוא או איפוס נתוני הכפר
          </p>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Cloud Import Section - Show prominently if there's local data */}
        {hasLocalData && (
          <section className="tile border-2 border-primary bg-primary/5">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary">
              <Cloud className="w-7 h-7" />
              העלאת נתונים לענן
            </h2>
            <p className="text-muted-foreground mb-4">
              זוהו נתונים מאוחסנים בדפדפן. לחץ כאן כדי להעלות אותם לענן ולאפשר גישה ממכשירים מרובים.
            </p>
            
            {cloudImportResult && (
              <div className={`p-4 rounded-xl mb-4 flex items-start gap-3 ${
                cloudImportResult.success 
                  ? 'bg-status-clean/20 border-2 border-status-clean' 
                  : 'bg-destructive/10 border-2 border-destructive'
              }`}>
                {cloudImportResult.success ? (
                  <Check className="w-6 h-6 text-status-clean flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold">{cloudImportResult.message}</p>
                  {cloudImportResult.stats && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <span>שכונות: {cloudImportResult.stats.neighborhoods}</span>
                      <span>אוהלים: {cloudImportResult.stats.tents}</span>
                      <span>מיטות: {cloudImportResult.stats.beds}</span>
                      <span>קבוצות: {cloudImportResult.stats.groups}</span>
                      <span>מתקנים: {cloudImportResult.stats.facilities}</span>
                      <span>מטבח: {cloudImportResult.stats.kitchenSlots}</span>
                      <span>שיבוצים: {cloudImportResult.stats.allocations}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {showClearConfirm && (
              <div className="p-4 bg-muted rounded-xl mb-4">
                <p className="font-medium mb-3">
                  הנתונים הועלו בהצלחה! האם למחוק את הנתונים המקומיים מהדפדפן?
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleClearLocalStorage}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-medium"
                  >
                    כן, מחק נתונים מקומיים
                  </button>
                  <button 
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-muted-foreground/20 rounded-lg font-medium"
                  >
                    לא, השאר לעת עתה
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={handleImportToCloud}
              disabled={isImportingToCloud}
              className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
            >
              {isImportingToCloud ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  מעלה נתונים...
                </>
              ) : (
                <>
                  <Database className="w-6 h-6" />
                  העלה נתונים מהדפדפן לענן
                </>
              )}
            </button>
          </section>
        )}

        {/* Admin Groups Section */}
        <section className="tile border-primary/30 bg-primary/5">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-7 h-7" />
            ניהול קבוצות והזמנות
          </h2>
          <p className="text-muted-foreground mb-6">
            צור וערוך קבוצות, לוחות זמנים ומידע על הזמנות
          </p>
          <button 
            onClick={() => navigate('/admin/groups')}
            className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Users className="w-6 h-6" />
            ניהול קבוצות / הזמנות
          </button>
        </section>

        {/* Management Section */}
        <section className="tile border-primary/30 bg-primary/5">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Briefcase className="w-7 h-7" />
            הנהלה
          </h2>
          <p className="text-muted-foreground mb-6">
            הכנסות, הוצאות, עובדים חיצוניים ודוחות
          </p>
          <button 
            onClick={() => navigate('/admin/income')}
            className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Briefcase className="w-6 h-6" />
            כניסה להנהלה
          </button>
        </section>

        {exportSuccess && (
          <div className="p-4 bg-status-clean/20 border-2 border-status-clean rounded-xl flex items-center gap-3 animate-slide-up">
            <Check className="w-6 h-6 text-status-clean" />
            <span className="font-semibold text-lg">{HE.messages.dataExported}</span>
          </div>
        )}
        {importSuccess && (
          <div className="p-4 bg-status-clean/20 border-2 border-status-clean rounded-xl flex items-center gap-3 animate-slide-up">
            <Check className="w-6 h-6 text-status-clean" />
            <span className="font-semibold text-lg">{HE.messages.dataImported}</span>
          </div>
        )}

        <section className="tile">
          <h2 className="text-2xl font-bold mb-4">{HE.pages.currentData}</h2>
          <p className="text-muted-foreground mb-4">
            {HE.dataManagement.lastModified} {new Date(state.lastModified).toLocaleString('he-IL')}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.neighborhoods}</div>
              <div className="text-muted-foreground">{HE.stats.neighborhoods}</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.tents}</div>
              <div className="text-muted-foreground">{HE.entities.tents}</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.beds}</div>
              <div className="text-muted-foreground">{HE.stats.beds}</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.facilities}</div>
              <div className="text-muted-foreground">{HE.stats.facilities}</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.reservations}</div>
              <div className="text-muted-foreground">{HE.entities.reservations}</div>
            </div>
          </div>
        </section>

        <section className="tile">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Download className="w-7 h-7" />
            {HE.pages.exportData}
          </h2>
          <p className="text-muted-foreground mb-6">{HE.dataManagement.dataStoredLocally}</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={handleExport} className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2">
              <FileJson className="w-6 h-6" />
              {HE.dataManagement.downloadJson}
            </button>
            <button onClick={handleCopyToClipboard} className="px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 flex items-center gap-2">
              <Copy className="w-6 h-6" />
              {HE.dataManagement.copyToClipboard}
            </button>
          </div>
        </section>

        <section className="tile">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-7 h-7" />
            {HE.pages.importData}
          </h2>
          <p className="text-muted-foreground mb-6">{HE.dataManagement.useImport}</p>

          {showImportForm ? (
            <div className="space-y-4">
              {importError && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="font-medium">{importError}</span>
                </div>
              )}
              <div className="flex gap-4">
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="px-4 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80">
                  {HE.dataManagement.chooseFile}
                </button>
                <span className="text-muted-foreground self-center">{HE.dataManagement.orPasteBelow}</span>
              </div>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={HE.messages.pasteJson}
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary font-mono"
                rows={8}
              />
              <div className="flex gap-4">
                <button onClick={() => { setShowImportForm(false); setImportJson(''); setImportError(''); }} className="flex-1 px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80">
                  {HE.actions.cancel}
                </button>
                <button onClick={handleImport} className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90">
                  {HE.pages.importData}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowImportForm(true)} className="px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 flex items-center gap-2">
              <Upload className="w-6 h-6" />
              {HE.dataManagement.importFromJson}
            </button>
          )}
        </section>

        <section className="tile border-destructive/50">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-destructive">
            <RotateCcw className="w-7 h-7" />
            {HE.pages.resetToDefault}
          </h2>
          <p className="text-muted-foreground mb-6">
            {HE.messages.resetWarning} <strong className="text-foreground">{HE.dataManagement.deleteWarning}</strong>
          </p>

          {showResetConfirm ? (
            <div className="p-6 bg-destructive/10 border-2 border-destructive rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg">{HE.messages.confirmReset}</p>
                  <p className="text-muted-foreground mt-1">{HE.dataManagement.deleteWarning}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowResetConfirm(false)} className="flex-1 px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80">
                  {HE.actions.cancel}
                </button>
                <button onClick={() => { resetToDefault(); setShowResetConfirm(false); }} className="flex-1 px-6 py-4 bg-destructive text-destructive-foreground rounded-xl font-bold text-lg hover:bg-destructive/90">
                  {HE.dataManagement.resetEverything}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowResetConfirm(true)} className="px-6 py-4 bg-destructive/20 text-destructive rounded-xl font-bold text-lg hover:bg-destructive/30 flex items-center gap-2">
              <RotateCcw className="w-6 h-6" />
              {HE.pages.resetToDefault}
            </button>
          )}
        </section>

        <section className="tile bg-muted/30">
          <h2 className="text-xl font-bold mb-4">{HE.pages.aboutDataStorage}</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• הנתונים מאוחסנים בענן ומסונכרנים בזמן אמת</li>
            <li>• ניתן לגשת לנתונים מכל מחשב או טלפון</li>
            <li>• שינויים מתעדכנים אוטומטית בכל המכשירים המחוברים</li>
            <li>• מומלץ לייצא גיבוי באופן קבוע</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Settings;
