"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppPage } from "@/components/app/app-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createNotificationTemplate } from "./notifications-actions";
import type { NotificationTemplate } from "./types";

export function NotificationTemplatesShell({
  locale,
  templates,
}: {
  locale: string;
  templates: NotificationTemplate[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState("");
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [titleTemplate, setTitleTemplate] = useState("Hello {{first_name}}");
  const [bodyTemplate, setBodyTemplate] = useState("Your shift starts at {{shift_time}}.");

  return (
    <AppPage>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notification Templates</h1>
          <p className="text-sm text-muted-foreground">
            Versioned template contracts with reusable placeholders and payload schema.
          </p>
        </div>
        <Button render={<Link href={`/${locale}/notifications`} />} variant="outline" className="h-9">
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Template</CardTitle>
          <CardDescription>Define reusable content blocks for campaigns and automations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
          <TemplateField label="Key">
            <Input className="h-9" value={key} onChange={(e) => setKey(e.target.value)} placeholder="attendance_reminder_v1" />
          </TemplateField>
          <TemplateField label="Name">
            <Input className="h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="Attendance Reminder" />
          </TemplateField>
          <TemplateField label="Category">
            <Input className="h-9" value={category} onChange={(e) => setCategory(e.target.value)} />
          </TemplateField>
          <TemplateField label="Title template">
            <Input className="h-9" value={titleTemplate} onChange={(e) => setTitleTemplate(e.target.value)} />
          </TemplateField>
          <TemplateField label="Body template">
            <Textarea rows={4} value={bodyTemplate} onChange={(e) => setBodyTemplate(e.target.value)} />
          </TemplateField>
          <div className="flex items-end gap-2">
            <Button
              className="h-9"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const response = await createNotificationTemplate({
                    key,
                    name,
                    category,
                    titleTemplate,
                    bodyTemplate,
                  });
                  if ("error" in response) {
                    setResult(`Failed: ${response.error}`);
                  } else {
                    setResult(`Template ${response.template.key} created.`);
                    setKey("");
                    setName("");
                    router.refresh();
                  }
                })
              }
            >
              {pending ? "Saving..." : "Create template"}
            </Button>
            {result ? <span className="text-sm text-muted-foreground">{result}</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template Library</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.key}</TableCell>
                  <TableCell>{template.name}</TableCell>
                  <TableCell>{template.category}</TableCell>
                  <TableCell>{template.version}</TableCell>
                  <TableCell>{template.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell>{new Date(template.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!templates.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No templates yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppPage>
  );
}

function TemplateField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
