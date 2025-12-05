import { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, ExternalLink, Code, Database, Key, Zap } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://mcmfwlgovubpdcfiqfvk.supabase.co/functions/v1";

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto text-sm font-mono">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
};

const EndpointCard = ({
  method,
  path,
  description,
  auth,
  params,
  example,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: "JWT" | "API Key" | "Both" | "None";
  params?: { name: string; type: string; description: string }[];
  example: string;
}) => {
  const methodColors = {
    GET: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    PATCH: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    DELETE: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Badge className={`${methodColors[method]} font-mono text-xs`}>{method}</Badge>
          <code className="text-sm font-mono text-foreground/80">{path}</code>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Key className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Authentication:</span>
          <Badge variant="outline">{auth}</Badge>
        </div>
        {params && params.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Parameters</p>
            <div className="space-y-1">
              {params.map((p) => (
                <div key={p.name} className="flex gap-2 text-sm">
                  <code className="text-primary">{p.name}</code>
                  <span className="text-muted-foreground">({p.type})</span>
                  <span>- {p.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-sm font-medium mb-2">Example</p>
          <CodeBlock code={example} />
        </div>
      </CardContent>
    </Card>
  );
};

export default function ApiDocs() {
  return (
    <>
      <Helmet>
        <title>API Documentation | SiteIntel™</title>
        <meta name="description" content="SiteIntel API documentation for developers. REST and OData endpoints for feasibility data." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Badge className="mb-4" variant="outline">
                <Code className="h-3 w-3 mr-1" />
                Developer Documentation
              </Badge>
              <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight mb-4">
                SiteIntel™ API
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Integrate feasibility intelligence into your applications with our REST and OData APIs.
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <a href="#quickstart">
                    <Zap className="h-4 w-4 mr-2" />
                    Quick Start
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`${API_BASE}/odata/$metadata`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    OData Metadata
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-12">
          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rest">REST API</TabsTrigger>
              <TabsTrigger value="odata">OData</TabsTrigger>
              <TabsTrigger value="auth">Auth</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <section id="quickstart">
                <h2 className="text-2xl font-heading font-bold mb-4">Quick Start</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        REST API
                      </CardTitle>
                      <CardDescription>
                        Standard REST endpoints for CRUD operations on applications and reports.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        code={`curl -X GET "${API_BASE}/api-v1/applications" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        OData v4.01
                      </CardTitle>
                      <CardDescription>
                        OData-compliant endpoints with filtering, sorting, and pagination.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        code={`curl -X GET "${API_BASE}/odata/Applications?\\$filter=status eq 'completed'&\\$top=10" \\
  -H "x-api-key: YOUR_API_KEY"`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">Base URLs</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">REST API</p>
                          <code className="text-sm text-muted-foreground">{API_BASE}/api-v1</code>
                        </div>
                        <Badge variant="outline">Production</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">OData Service</p>
                          <code className="text-sm text-muted-foreground">{API_BASE}/odata</code>
                        </div>
                        <Badge variant="outline">Production</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-heading font-bold mb-4">Rate Limits</h2>
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">100</p>
                        <p className="text-sm text-muted-foreground">Requests/hour (Free)</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">1,000</p>
                        <p className="text-sm text-muted-foreground">Requests/hour (Pro)</p>
                      </div>
                      <div className="p-4 border border-border rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">10,000</p>
                        <p className="text-sm text-muted-foreground">Requests/hour (Enterprise)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* REST API Tab */}
            <TabsContent value="rest" className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">REST Endpoints</h2>

              <EndpointCard
                method="GET"
                path="/api-v1/applications"
                description="List all applications for the authenticated user with pagination and filtering."
                auth="JWT"
                params={[
                  { name: "limit", type: "integer", description: "Max records (default: 20, max: 100)" },
                  { name: "offset", type: "integer", description: "Skip records for pagination" },
                  { name: "status", type: "string", description: "Filter by status" },
                  { name: "county", type: "string", description: "Filter by county" },
                ]}
                example={`curl -X GET "${API_BASE}/api-v1/applications?status=completed&limit=10" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
              />

              <EndpointCard
                method="POST"
                path="/api-v1/applications"
                description="Create a new feasibility application."
                auth="JWT"
                example={`curl -X POST "${API_BASE}/api-v1/applications" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "full_name": "John Developer",
    "email": "john@example.com",
    "phone": "555-555-5555",
    "company": "Acme Dev LLC",
    "formatted_address": "123 Main St, Houston, TX",
    "ownership_status": "exploring",
    "existing_improvements": "Vacant land",
    "stories_height": "2",
    "project_type": ["retail"],
    "quality_level": "standard",
    "heard_about": "referral"
  }'`}
              />

              <EndpointCard
                method="GET"
                path="/api-v1/applications/{id}"
                description="Retrieve a single application by UUID."
                auth="JWT"
                example={`curl -X GET "${API_BASE}/api-v1/applications/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
              />

              <EndpointCard
                method="PATCH"
                path="/api-v1/applications/{id}"
                description="Update an existing application."
                auth="JWT"
                example={`curl -X PATCH "${API_BASE}/api-v1/applications/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"additional_notes": "Updated notes"}'`}
              />

              <EndpointCard
                method="DELETE"
                path="/api-v1/applications/{id}"
                description="Delete an application by UUID."
                auth="JWT"
                example={`curl -X DELETE "${API_BASE}/api-v1/applications/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`}
              />
            </TabsContent>

            {/* OData Tab */}
            <TabsContent value="odata" className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">OData v4.01 Endpoints</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>Service Document</CardTitle>
                  <CardDescription>Discover available entity sets</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={`GET ${API_BASE}/odata`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Metadata ($metadata)</CardTitle>
                  <CardDescription>EDM schema in CSDL XML format</CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={`GET ${API_BASE}/odata/$metadata`} />
                </CardContent>
              </Card>

              <section>
                <h3 className="text-xl font-heading font-semibold mb-4">Query Options</h3>
                <div className="grid gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">$filter</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">Filter results using OData expressions</p>
                      <CodeBlock
                        code={`# Exact match
$filter=status eq 'completed'

# Numeric comparison
$filter=traffic_aadt gt 10000

# String functions
$filter=contains(formatted_address, 'Houston')

# Multiple conditions
$filter=status eq 'completed' and county eq 'Harris'`}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">$select, $orderby, $top, $skip</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        code={`# Select specific fields
$select=id,formatted_address,status,created_at

# Sort by field
$orderby=created_at desc

# Pagination
$top=10&$skip=20

# Combined
$select=id,city,status&$orderby=created_at desc&$top=50`}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">$count</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CodeBlock
                        code={`# Include total count in response
$count=true

# Response includes @odata.count`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-heading font-semibold mb-4">Example Queries</h3>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    <CodeBlock
                      code={`# List applications in Harris County
GET ${API_BASE}/odata/Applications?$filter=county eq 'Harris'&$select=id,formatted_address,status

# Get completed applications sorted by date
GET ${API_BASE}/odata/Applications?$filter=status eq 'completed'&$orderby=created_at desc&$top=50

# Count applications by flood zone
GET ${API_BASE}/odata/Applications?$filter=floodplain_zone ne null&$count=true

# Search by address substring
GET ${API_BASE}/odata/Applications?$filter=contains(formatted_address,'Main St')

# Get single application by ID
GET ${API_BASE}/odata/Applications('550e8400-e29b-41d4-a716-446655440000')

# List reports with pagination
GET ${API_BASE}/odata/Reports?$top=10&$skip=20&$orderby=created_at desc`}
                    />
                  </div>
                </ScrollArea>
              </section>
            </TabsContent>

            {/* Auth Tab */}
            <TabsContent value="auth" className="space-y-6">
              <h2 className="text-2xl font-heading font-bold">Authentication</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      JWT Bearer Token
                    </CardTitle>
                    <CardDescription>
                      For user-authenticated requests via Supabase Auth
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      Obtain a JWT token by signing in through Supabase Auth. Include it in the Authorization header.
                    </p>
                    <CodeBlock
                      code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
                    />
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <p className="text-sm text-amber-400">
                        JWT tokens expire. Refresh them using Supabase's token refresh mechanism.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Key
                    </CardTitle>
                    <CardDescription>
                      For server-to-server integrations (Pro/Enterprise)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      API keys are available for Pro and Enterprise subscribers. Include in the x-api-key header.
                    </p>
                    <CodeBlock code={`x-api-key: sk_live_abcd1234...`} />
                    <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                      <p className="text-sm text-primary">
                        Contact support to obtain API keys for your organization.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <section>
                <h3 className="text-xl font-heading font-semibold mb-4">Error Responses</h3>
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                        <Badge variant="destructive">401</Badge>
                        <div>
                          <p className="font-medium">Unauthorized</p>
                          <p className="text-sm text-muted-foreground">Missing or invalid authentication</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                        <Badge variant="destructive">403</Badge>
                        <div>
                          <p className="font-medium">Forbidden</p>
                          <p className="text-sm text-muted-foreground">Insufficient permissions or API key scope</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                        <Badge variant="destructive">429</Badge>
                        <div>
                          <p className="font-medium">Too Many Requests</p>
                          <p className="text-sm text-muted-foreground">Rate limit exceeded</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
