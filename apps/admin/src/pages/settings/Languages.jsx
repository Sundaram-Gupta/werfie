import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, Plus } from 'lucide-react';

export default function LanguagesPage() {
  const [languages, setLanguages] = useState([
    { code: 'en', name: 'English', enabled: true, default: true, completion: '100%' },
    { code: 'hi', name: 'Hindi', enabled: true, default: false, completion: '85%' },
    { code: 'es', name: 'Spanish', enabled: true, default: false, completion: '90%' },
    { code: 'fr', name: 'French', enabled: true, default: false, completion: '80%' },
    { code: 'de', name: 'German', enabled: true, default: false, completion: '75%' },
  ]);

  const toggleLanguage = (code) => {
    setLanguages(languages.map(lang => 
      lang.code === code && !lang.default ? { ...lang, enabled: !lang.enabled } : lang
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Language Management</h2>
          <p className="text-muted-foreground">Manage supported languages and translations</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Language
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supported Languages</CardTitle>
          <CardDescription>Enable or disable languages available to users.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((lang) => (
                <TableRow key={lang.code}>
                  <TableCell className="font-medium uppercase">{lang.code}</TableCell>
                  <TableCell>{lang.name}</TableCell>
                  <TableCell>
                    <Badge variant={lang.enabled ? "default" : "secondary"}>
                      {lang.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lang.default && <Badge variant="outline">Default</Badge>}
                  </TableCell>
                  <TableCell>{lang.completion}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2 items-center">
                     <Switch 
                        checked={lang.enabled} 
                        onCheckedChange={() => toggleLanguage(lang.code)}
                        disabled={lang.default}
                     />
                     <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Translation Editor</CardTitle>
            <CardDescription>Quick edit common strings</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-sm text-muted-foreground p-4 bg-secondary rounded-md">
                Select a language to edit its translation keys JSON. (Implementation in progress)
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
