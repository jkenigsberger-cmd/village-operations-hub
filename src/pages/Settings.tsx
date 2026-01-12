import React, { useState, useRef } from 'react';
import { useVillage } from '@/context/VillageContext';
import { BreadcrumbNav } from '@/components/BreadcrumbNav';
import { 
  Loader2, 
  Settings as SettingsIcon, 
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  Copy,
  FileJson
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { 
    state, 
    isLoading,
    exportState,
    importState,
    resetToDefault
  } = useVillage();

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setImportError('Please paste JSON data');
      return;
    }

    const success = importState(importJson.trim());
    
    if (success) {
      setImportSuccess(true);
      setImportJson('');
      setShowImportForm(false);
      setTimeout(() => setImportSuccess(false), 3000);
    } else {
      setImportError('Invalid JSON format. Please check the data.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportJson(content);
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetToDefault();
    setShowResetConfirm(false);
  };

  // Calculate stats
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
        <div className="container py-6">
          <BreadcrumbNav items={[{ label: 'Settings' }]} />
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <SettingsIcon className="w-10 h-10" />
            Settings & Data
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Export, import, or reset your village data
          </p>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* Success Messages */}
        {exportSuccess && (
          <div className="p-4 bg-status-clean/20 border-2 border-status-clean rounded-xl flex items-center gap-3 animate-slide-up">
            <Check className="w-6 h-6 text-status-clean" />
            <span className="font-semibold text-lg">Data exported successfully!</span>
          </div>
        )}
        {importSuccess && (
          <div className="p-4 bg-status-clean/20 border-2 border-status-clean rounded-xl flex items-center gap-3 animate-slide-up">
            <Check className="w-6 h-6 text-status-clean" />
            <span className="font-semibold text-lg">Data imported successfully!</span>
          </div>
        )}

        {/* Current Data Stats */}
        <section className="tile">
          <h2 className="text-2xl font-bold mb-4">Current Data</h2>
          <p className="text-muted-foreground mb-4">
            Last modified: {new Date(state.lastModified).toLocaleString()}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.neighborhoods}</div>
              <div className="text-muted-foreground">Neighborhoods</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.tents}</div>
              <div className="text-muted-foreground">Tents</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.beds}</div>
              <div className="text-muted-foreground">Beds</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.facilities}</div>
              <div className="text-muted-foreground">Facilities</div>
            </div>
            <div className="p-4 bg-muted rounded-xl text-center">
              <div className="text-3xl font-bold">{stats.reservations}</div>
              <div className="text-muted-foreground">Reservations</div>
            </div>
          </div>
        </section>

        {/* Export Section */}
        <section className="tile">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Download className="w-7 h-7" />
            Export Data
          </h2>
          <p className="text-muted-foreground mb-6">
            Download your data as a JSON file to back up or transfer to another device.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExport}
              className="px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center gap-2"
            >
              <FileJson className="w-6 h-6" />
              Download JSON File
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 flex items-center gap-2"
            >
              <Copy className="w-6 h-6" />
              Copy to Clipboard
            </button>
          </div>
        </section>

        {/* Import Section */}
        <section className="tile">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Upload className="w-7 h-7" />
            Import Data
          </h2>
          <p className="text-muted-foreground mb-6">
            Import data from a JSON file or paste JSON content. This will replace all current data.
          </p>

          {showImportForm ? (
            <div className="space-y-4">
              {importError && (
                <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span className="font-medium">{importError}</span>
                </div>
              )}

              <div className="flex gap-4">
                <input
                  type="file"
                  accept=".json"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-3 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80"
                >
                  Choose File
                </button>
                <span className="text-muted-foreground self-center">or paste JSON below</span>
              </div>

              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste JSON data here..."
                className="w-full px-4 py-3 text-base rounded-xl border-2 border-input bg-background resize-none focus:outline-none focus:border-primary font-mono"
                rows={8}
              />

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowImportForm(false);
                    setImportJson('');
                    setImportError('');
                  }}
                  className="flex-1 px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90"
                >
                  Import Data
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowImportForm(true)}
              className="px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80 flex items-center gap-2"
            >
              <Upload className="w-6 h-6" />
              Import from JSON
            </button>
          )}
        </section>

        {/* Reset Section */}
        <section className="tile border-destructive/50">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-destructive">
            <RotateCcw className="w-7 h-7" />
            Reset to Default
          </h2>
          <p className="text-muted-foreground mb-6">
            This will delete all current data and restore the village to its initial state. 
            <strong className="text-foreground"> This action cannot be undone.</strong>
          </p>

          {showResetConfirm ? (
            <div className="p-6 bg-destructive/10 border-2 border-destructive rounded-xl space-y-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-bold text-lg">Are you absolutely sure?</p>
                  <p className="text-muted-foreground mt-1">
                    All tent assignments, guest names, cleaning statuses, and reservations will be permanently deleted.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-6 py-4 bg-muted text-foreground rounded-xl font-bold text-lg hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-4 bg-destructive text-destructive-foreground rounded-xl font-bold text-lg hover:bg-destructive/90"
                >
                  Yes, Reset Everything
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-6 py-4 bg-destructive/20 text-destructive rounded-xl font-bold text-lg hover:bg-destructive/30 flex items-center gap-2"
            >
              <RotateCcw className="w-6 h-6" />
              Reset to Default
            </button>
          )}
        </section>

        {/* Info Section */}
        <section className="tile bg-muted/30">
          <h2 className="text-xl font-bold mb-4">About Data Storage</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• All data is stored locally in your browser</li>
            <li>• Data persists until you clear your browser data</li>
            <li>• Export regularly to create backups</li>
            <li>• Use Import to transfer data between devices</li>
            <li>• No internet connection required after initial load</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default Settings;
