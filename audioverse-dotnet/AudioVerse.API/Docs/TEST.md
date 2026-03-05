Log level is set to Informational (Default).
Connected to test environment '< Local Windows Environment >'
Test data store opened in 0.045 sec.
Building Test Projects
Aborting test run due to build failures. Please see the build output for more details.
You can change this default behavior by going to 'Tools -> Options -> Project and Solution -> Build and Run -> On Run, When build or deployment errors occur'
Aborting test run due to build failures. Please see the build output for more details.
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.67]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.72]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 2.1 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.44]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.49]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 866.1 ms ==========
========== Starting test run ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.10]   Starting:    AudioVerse.Tests
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
[21:28:58 INF] Application starting...
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
[xUnit.net 00:00:04.33]     AudioVerse.Tests.Integration.MediaLibraryIntegrationTests.Import_ExternalTrack_CreatesArtistAndSong [FAIL]
[xUnit.net 00:00:04.33]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.33]       Stack Trace:
[xUnit.net 00:00:04.33]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.33]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
Starting AudioVerse.API
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.33]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.33]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
Starting AudioVerse.API
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
Starting AudioVerse.API
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
Starting AudioVerse.API
[xUnit.net 00:00:04.33]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.33]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.33]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.33]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.33]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.33]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.33]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.33]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.33]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\MediaLibraryIntegrationTests.cs(15,0): at AudioVerse.Tests.Integration.MediaLibraryIntegrationTests.AuthClient()
[xUnit.net 00:00:04.33]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\MediaLibraryIntegrationTests.cs(163,0): at AudioVerse.Tests.Integration.MediaLibraryIntegrationTests.Import_ExternalTrack_CreatesArtistAndSong()
[xUnit.net 00:00:04.33]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.AudioEditorIntegrationTests.GetProjects_Unauthenticated_ReturnsOk [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\AudioEditorIntegrationTests.cs(37,0): at AudioVerse.Tests.Integration.AudioEditorIntegrationTests.GetProjects_Unauthenticated_ReturnsOk()
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.SkinThemeIntegrationTests.GetPublicSkins_ReturnsOk [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\SkinThemeIntegrationTests.cs(15,0): at AudioVerse.Tests.Integration.SkinThemeIntegrationTests.CreateAdminClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\SkinThemeIntegrationTests.cs(23,0): at AudioVerse.Tests.Integration.SkinThemeIntegrationTests.GetPublicSkins_ReturnsOk()
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.EventsIntegrationTests.AddInviteToEvent_Succeeds [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventsIntegrationTests.cs(50,0): at AudioVerse.Tests.Integration.EventsIntegrationTests.AddInviteToEvent_Succeeds()
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.AiControllersIntegrationTests.AiAudio_Unauthorized_Returns401 [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InterpretedInvoke_Method(Object obj, IntPtr* args)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeDirectByRefWithFewArgs(Object obj, Span`1 copyOfArgs, BindingFlags invokeAttr)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\AiControllersIntegrationTests.cs(36,0): at AudioVerse.Tests.Integration.AiControllersIntegrationTests.AiAudio_Unauthorized_Returns401()
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.SecurityIntegrationTests.FuzzJson_PostExpense_DoesNotCrash(body: "") [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\SecurityIntegrationTests.cs(128,0): at AudioVerse.Tests.Integration.SecurityIntegrationTests.FuzzJson_PostExpense_DoesNotCrash(String body)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]     AudioVerse.Tests.Integration.MediaCatalogIntegrationTests.Books_GetAll_Returns200 [FAIL]
[xUnit.net 00:00:04.34]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.34]       Stack Trace:
[xUnit.net 00:00:04.34]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.34]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.34]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.34]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.34]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.34]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.34]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.34]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.35]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\MediaCatalogIntegrationTests.cs(16,0): at AudioVerse.Tests.Integration.MediaCatalogIntegrationTests.AuthClient()
[xUnit.net 00:00:04.35]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\MediaCatalogIntegrationTests.cs(67,0): at AudioVerse.Tests.Integration.MediaCatalogIntegrationTests.Books_GetAll_Returns200()
[xUnit.net 00:00:04.35]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.35]     AudioVerse.Tests.Integration.EventE2EFlowTests.FullEventFlow_CreateEvent_AddSchedule_AddMenu_AddPoll_Vote_Billing [FAIL]
[xUnit.net 00:00:04.35]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.35]       Stack Trace:
[xUnit.net 00:00:04.35]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.35]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.35]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.35]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.35]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.35]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.35]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.35]            at System.Reflection.MethodBaseInvoker.InterpretedInvoke_Method(Object obj, IntPtr* args)
[xUnit.net 00:00:04.35]            at System.Reflection.MethodBaseInvoker.InvokeDirectByRefWithFewArgs(Object obj, Span`1 copyOfArgs, BindingFlags invokeAttr)
[xUnit.net 00:00:04.35]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.35]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.35]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.36]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventE2EFlowTests.cs(20,0): at AudioVerse.Tests.Integration.EventE2EFlowTests.FullEventFlow_CreateEvent_AddSchedule_AddMenu_AddPoll_Vote_Billing()
[xUnit.net 00:00:04.36]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.36]     AudioVerse.Tests.Integration.TeamsAndQueueIntegrationTests.Team_CreateAndAddPlayer [FAIL]
[xUnit.net 00:00:04.36]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.36]       Stack Trace:
[xUnit.net 00:00:04.36]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.36]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.36]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.36]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.36]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.36]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.36]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(410,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.36]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.36]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.36]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.36]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.36]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.36]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\TeamsAndQueueIntegrationTests.cs(18,0): at AudioVerse.Tests.Integration.TeamsAndQueueIntegrationTests.Setup()
[xUnit.net 00:00:04.36]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\TeamsAndQueueIntegrationTests.cs(37,0): at AudioVerse.Tests.Integration.TeamsAndQueueIntegrationTests.Team_CreateAndAddPlayer()
[xUnit.net 00:00:04.36]         --- End of stack trace from previous location ---
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Application starting...
[21:29:00 INF] Application starting...
[21:29:00 INF] Application starting...
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Application starting...
[21:29:00 INF] Application starting...
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Application starting...
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Application starting...
[21:29:00 INF] Application starting...
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Application starting...
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Ensuring bucket exists: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: audio-files
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Bucket ensured: karaoke-recordings
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Ensuring bucket exists: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Bucket ensured: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:00 INF] Setting bucket public: party-posters
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:05 INF] HTTP DELETE /api/user/connections/nonexistent-platform responded 400 in 95.5742 ms
[21:29:05 INF] HTTP DELETE /api/user/connections/nonexistent-platform responded 400 in 95.5742 ms
[21:29:05 INF] HTTP POST /api/ai/video/pose responded 400 in 107.0143 ms
[21:29:05 INF] HTTP POST /api/ai/video/pose responded 400 in 107.0143 ms
[21:29:05 INF] HTTP DELETE /api/admin/skins/999999 responded 404 in 114.9578 ms
[21:29:05 INF] HTTP DELETE /api/admin/skins/999999 responded 404 in 114.9578 ms
[21:29:05 INF] HTTP POST /api/games/board/sessions responded 201 in 142.3514 ms
[21:29:05 INF] HTTP POST /api/games/board/sessions responded 201 in 142.3514 ms
[21:29:05 INF] HTTP PUT /api/audio-editor/projects/99999 responded 404 in 145.0797 ms
[21:29:05 INF] HTTP PUT /api/audio-editor/projects/99999 responded 404 in 145.0797 ms
[21:29:05 INF] HTTP POST /api/events/1/sessions responded 200 in 119.7716 ms
[21:29:05 INF] HTTP POST /api/events/1/sessions responded 200 in 119.7716 ms
[21:29:05 INF] HTTP POST /api/ai/audio/transcribe responded 400 in 22.9108 ms
[21:29:05 INF] HTTP POST /api/ai/audio/transcribe responded 400 in 22.9108 ms
[21:29:05 INF] Application started
[21:29:05 INF] Application started
[21:29:05 INF] Start processing HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[21:29:05 INF] Start processing HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[21:29:05 INF] Sending HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[21:29:05 INF] Sending HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[21:29:05 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 114.8355 ms
[21:29:05 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 114.8355 ms
[21:29:05 INF] HTTP POST /api/karaoke/events/1/queue responded 201 in 239.3276 ms
[21:29:05 INF] HTTP POST /api/karaoke/events/1/queue responded 201 in 239.3276 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 268.6538 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 268.6538 ms
[21:29:05 INF] HTTP POST /api/media/books responded 201 in 269.0465 ms
[21:29:05 INF] HTTP POST /api/media/books responded 201 in 269.0465 ms
[21:29:05 INF] HTTP POST /api/library/songs responded 201 in 269.1115 ms
[21:29:05 INF] HTTP POST /api/library/songs responded 201 in 269.1115 ms
[21:29:05 INF] HTTP DELETE /api/audio-editor/projects/99999/tracks/99999 responded 404 in 107.4939 ms
[21:29:05 INF] HTTP DELETE /api/audio-editor/projects/99999/tracks/99999 responded 404 in 107.4939 ms
[21:29:05 INF] HTTP POST /api/admin/skins responded 201 in 158.6791 ms
[21:29:05 INF] HTTP POST /api/admin/skins responded 201 in 158.6791 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 7.6354 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 7.6354 ms
[21:29:05 INF] HTTP POST /api/audio-editor/projects responded 201 in 34.7850 ms
[21:29:05 INF] HTTP POST /api/audio-editor/projects responded 201 in 34.7850 ms
[21:29:05 INF] HTTP POST /api/library/songs/1/details responded 200 in 71.8465 ms
[21:29:05 INF] HTTP POST /api/library/songs/1/details responded 200 in 71.8465 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 21.0467 ms
[21:29:05 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 21.0467 ms
[21:29:05 INF] HTTP GET /api/admin/skins responded 200 in 38.7078 ms
[21:29:05 INF] HTTP GET /api/admin/skins responded 200 in 38.7078 ms
Starting AudioVerse.API
[21:29:05 INF] HTTP GET /api/media/books/1 responded 200 in 87.4776 ms
[21:29:05 INF] HTTP GET /api/media/books/1 responded 200 in 87.4776 ms
[21:29:05 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 96.8076 ms
[21:29:05 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 96.8076 ms
[21:29:05 INF] HTTP GET /api/library/songs/1/details responded 200 in 17.0777 ms
[21:29:05 INF] HTTP GET /api/library/songs/1/details responded 200 in 17.0777 ms
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 43.2258 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 43.2258 ms
[21:29:05 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J12P)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:06 INF] HTTP GET /api/audio-editor/projects responded 200 in 38.7202 ms
[21:29:06 INF] HTTP GET /api/audio-editor/projects responded 200 in 38.7202 ms
[21:29:05 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J12P)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
Starting AudioVerse.API
[21:29:06 ERR] HTTP POST /api/events/1/participants responded 500 in 135.6643 ms
[21:29:06 ERR] HTTP POST /api/events/1/participants responded 500 in 135.6643 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 3.2466 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 3.2466 ms
[21:29:06 INF] HTTP GET /api/games/board/stats/player/1 responded 200 in 144.2309 ms
[21:29:06 INF] HTTP GET /api/games/board/stats/player/1 responded 200 in 144.2309 ms
[21:29:06 INF] HTTP DELETE /api/library/songs/details/1 responded 204 in 21.5368 ms
[21:29:06 INF] HTTP DELETE /api/library/songs/details/1 responded 204 in 21.5368 ms
[xUnit.net 00:00:10.55]     AudioVerse.Tests.Integration.EventsIntegrationTests.AddParticipantToEvent_AsOrganizer_Succeeds [FAIL]
[xUnit.net 00:00:10.55]       Assert.Equal() Failure: Values differ
[xUnit.net 00:00:10.55]       Expected: OK
[xUnit.net 00:00:10.55]       Actual:   InternalServerError
[xUnit.net 00:00:10.55]       Stack Trace:
[xUnit.net 00:00:10.55]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventsIntegrationTests.cs(44,0): at AudioVerse.Tests.Integration.EventsIntegrationTests.AddParticipantToEvent_AsOrganizer_Succeeds()
[xUnit.net 00:00:10.55]         --- End of stack trace from previous location ---
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] Application started
Starting AudioVerse.API
Starting AudioVerse.API
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 26.2022 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 26.2022 ms
[21:29:06 INF] HTTP POST /api/karaoke/players/1/favorites/1 responded 200 in 36.9058 ms
[21:29:06 INF] HTTP POST /api/karaoke/players/1/favorites/1 responded 200 in 36.9058 ms
[21:29:06 INF] HTTP GET /api/media/tv responded 200 in 49.3233 ms
[21:29:06 INF] HTTP GET /api/media/tv responded 200 in 49.3233 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 2.3140 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 2.3140 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 4.2753 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 4.2753 ms
[21:29:06 INF] HTTP GET /api/karaoke/players/1/favorites responded 200 in 20.2497 ms
[21:29:06 INF] HTTP GET /api/karaoke/players/1/favorites responded 200 in 20.2497 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 9.4973 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 9.4973 ms
[21:29:06 INF] HTTP GET /api/audio-editor/projects/99999 responded 404 in 86.1883 ms
[21:29:06 INF] HTTP GET /api/audio-editor/projects/99999 responded 404 in 86.1883 ms
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] HTTP DELETE /api/karaoke/players/1/favorites/1 responded 204 in 22.4992 ms
[21:29:06 INF] HTTP DELETE /api/karaoke/players/1/favorites/1 responded 204 in 22.4992 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 3.1231 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 3.1231 ms
Starting AudioVerse.API
[21:29:06 INF] HTTP POST /api/library/files/audio responded 200 in 60.8193 ms
[21:29:06 INF] HTTP POST /api/library/files/audio responded 200 in 60.8193 ms
[21:29:06 INF] HTTP POST /api/media/movies responded 201 in 48.2931 ms
[21:29:06 INF] HTTP POST /api/media/movies responded 201 in 48.2931 ms
[21:29:06 INF] HTTP GET /api/library/files/audio responded 200 in 13.6228 ms
[21:29:06 INF] HTTP GET /api/library/files/audio responded 200 in 13.6228 ms
[21:29:06 INF] HTTP GET /api/events/99999/schedule responded 200 in 16.3025 ms
[21:29:06 INF] HTTP GET /api/events/99999/schedule responded 200 in 16.3025 ms
[21:29:06 INF] HTTP GET /api/media/movies/1 responded 200 in 19.1838 ms
[21:29:06 INF] HTTP GET /api/media/movies/1 responded 200 in 19.1838 ms
[21:29:06 INF] HTTP GET /etc/passwd/schedule responded 404 in 1.7704 ms
[21:29:06 INF] HTTP GET /etc/passwd/schedule responded 404 in 1.7704 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 37.3813 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 37.3813 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 64.4153 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 64.4153 ms
[21:29:06 INF] Application starting...
[21:29:06 INF] HTTP GET /api/media/sports responded 200 in 38.6571 ms
[21:29:06 INF] HTTP GET /api/media/sports responded 200 in 38.6571 ms
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Application starting...
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 18.0643 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 18.0643 ms
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Application starting...
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Application starting...
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 45.7068 ms
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 45.7068 ms
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 5.1992 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 5.1992 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 3.8445 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 200 in 3.8445 ms
[21:29:06 INF] HTTP GET /api/admin/events responded 403 in 2.6367 ms
[21:29:06 INF] HTTP GET /api/admin/events responded 403 in 2.6367 ms
[21:29:06 INF] HTTP POST /api/media/sports responded 201 in 69.2403 ms
[21:29:06 INF] HTTP POST /api/media/sports responded 201 in 69.2403 ms
[21:29:06 INF] HTTP POST /api/library/albums/1/artists responded 200 in 43.0188 ms
[21:29:06 INF] HTTP POST /api/library/albums/1/artists responded 200 in 43.0188 ms
[21:29:06 INF] HTTP GET /api/admin/dashboard responded 403 in 0.1988 ms
[21:29:06 INF] HTTP GET /api/admin/dashboard responded 403 in 0.1988 ms
[21:29:06 INF] Application starting...
Starting AudioVerse.API
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.8915 ms
[21:29:06 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.8915 ms
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] HTTP GET /api/admin/dashboard responded 401 in 0.2448 ms
[21:29:06 INF] HTTP GET /api/admin/dashboard responded 401 in 0.2448 ms
[21:29:06 INF] HTTP GET /api/admin/events responded 401 in 0.0829 ms
[21:29:06 INF] HTTP GET /api/admin/events responded 401 in 0.0829 ms
[21:29:06 INF] HTTP GET /api/media/sports/1 responded 200 in 58.3908 ms
[21:29:06 INF] HTTP GET /api/media/sports/1 responded 200 in 58.3908 ms
[21:29:06 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.0706 ms
[21:29:06 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.0706 ms
[21:29:06 INF] HTTP GET /api/library/albums/1 responded 200 in 95.1768 ms
[21:29:06 INF] HTTP GET /api/library/albums/1 responded 200 in 95.1768 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 401 in 0.0709 ms
[21:29:06 INF] HTTP GET /api/karaoke/search-songs responded 401 in 0.0709 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 11.8882 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 11.8882 ms
[21:29:06 INF] HTTP DELETE /api/media/movies/99999 responded 404 in 54.9984 ms
[21:29:06 INF] HTTP DELETE /api/media/movies/99999 responded 404 in 54.9984 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 10.5954 ms
[21:29:06 INF] HTTP POST /api/karaoke/teams responded 400 in 10.5954 ms
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 11.4013 ms
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 11.4013 ms
[21:29:06 INF] Application started
[21:29:06 INF] Application started
[21:29:06 INF] HTTP POST /api/library/songs responded 201 in 24.8752 ms
[21:29:06 INF] HTTP POST /api/library/songs responded 201 in 24.8752 ms
[21:29:06 INF] HTTP GET /api/media/movies responded 200 in 78.9873 ms
[21:29:06 INF] HTTP GET /api/media/movies responded 200 in 78.9873 ms
[21:29:06 INF] Application starting...
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] HTTP GET /api/library/songs/2 responded 200 in 82.4676 ms
[21:29:06 INF] HTTP GET /api/library/songs/2 responded 200 in 82.4676 ms
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] HTTP GET /api/media/movies/99999 responded 404 in 5.7153 ms
[21:29:06 INF] HTTP GET /api/media/movies/99999 responded 404 in 5.7153 ms
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] HTTP GET /api/library/songs responded 200 in 38.6896 ms
[21:29:06 INF] HTTP GET /api/library/songs responded 200 in 38.6896 ms
[21:29:06 INF] HTTP DELETE /api/library/songs/2 responded 204 in 37.0769 ms
[21:29:06 INF] HTTP DELETE /api/library/songs/2 responded 204 in 37.0769 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 5.2823 ms
[21:29:06 INF] HTTP POST /api/library/artists responded 201 in 5.2823 ms
[21:29:06 INF] HTTP POST /api/media/tv responded 201 in 95.6544 ms
[21:29:06 INF] HTTP POST /api/media/tv responded 201 in 95.6544 ms
[21:29:06 INF] HTTP PUT /api/library/artists/3 responded 200 in 26.0522 ms
[21:29:06 INF] HTTP PUT /api/library/artists/3 responded 200 in 26.0522 ms
[21:29:06 INF] HTTP GET /api/media/tv/1 responded 200 in 52.1548 ms
[21:29:06 INF] HTTP GET /api/media/tv/1 responded 200 in 52.1548 ms
[21:29:06 INF] HTTP GET /api/library/artists/3 responded 200 in 55.8510 ms
[21:29:06 INF] HTTP GET /api/library/artists/3 responded 200 in 55.8510 ms
[21:29:06 INF] Application started
[21:29:06 INF] Application started
Starting AudioVerse.API
Starting AudioVerse.API
[21:29:06 INF] HTTP POST /api/library/playlists responded 200 in 35.1767 ms
[21:29:06 INF] HTTP POST /api/library/playlists responded 200 in 35.1767 ms
[21:29:06 INF] Received HTTP response headers after 1024.6933ms - 200
[21:29:06 INF] Received HTTP response headers after 1024.6933ms - 200
[21:29:06 INF] End processing HTTP request after 1040.6336ms - 200
[21:29:06 INF] End processing HTTP request after 1040.6336ms - 200
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 6.5398 ms
[21:29:06 INF] HTTP POST /api/library/albums responded 201 in 6.5398 ms
[21:29:06 INF] HTTP PUT /api/library/albums/3 responded 200 in 18.7983 ms
[21:29:06 INF] HTTP PUT /api/library/albums/3 responded 200 in 18.7983 ms
[21:29:06 INF] HTTP DELETE /api/library/albums/3 responded 204 in 14.4471 ms
[21:29:06 INF] HTTP DELETE /api/library/albums/3 responded 204 in 14.4471 ms
[21:29:06 INF] Linked external account: User 1, Platform BoardGameGeek
[21:29:06 INF] Linked external account: User 1, Platform BoardGameGeek
[21:29:06 INF] HTTP POST /api/user/connections/bgg/link responded 200 in 1159.6026 ms
[21:29:06 INF] HTTP POST /api/user/connections/bgg/link responded 200 in 1159.6026 ms
[21:29:06 INF] Application starting...
[21:29:06 INF] Application starting...
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Ensuring bucket exists: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: audio-files
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Bucket ensured: karaoke-recordings
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Ensuring bucket exists: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Bucket ensured: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] Setting bucket public: party-posters
[21:29:06 INF] HTTP POST /api/library/files/media responded 200 in 63.8774 ms
[21:29:06 INF] HTTP GET /api/user/connections responded 200 in 42.0434 ms
[21:29:06 INF] HTTP GET /api/user/connections responded 200 in 42.0434 ms
[21:29:06 INF] HTTP POST /api/library/files/media responded 200 in 63.8774 ms
[21:29:07 INF] HTTP GET /api/user/connections/steam/auth-url responded 400 in 8.4972 ms
[21:29:07 INF] HTTP GET /api/user/connections/steam/auth-url responded 400 in 8.4972 ms
[21:29:07 INF] HTTP GET /api/user/connections responded 401 in 0.0925 ms
[21:29:07 INF] HTTP GET /api/user/connections responded 401 in 0.0925 ms
[21:29:07 INF] HTTP GET /api/library/files/media responded 200 in 25.1876 ms
[21:29:07 INF] HTTP GET /api/library/files/media responded 200 in 25.1876 ms
[21:29:07 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:07 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:07 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:07 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:07 INF] HTTP GET /api/user/connections/nonexistent-platform responded 400 in 10.5641 ms
[21:29:07 INF] HTTP GET /api/user/connections/nonexistent-platform responded 400 in 10.5641 ms
[21:29:07 INF] Application started
[21:29:07 INF] Application started
Starting AudioVerse.API
[21:29:07 INF] Received HTTP response headers after 198.3544ms - 200
[21:29:07 INF] Received HTTP response headers after 198.3544ms - 200
[21:29:07 INF] End processing HTTP request after 198.842ms - 200
[21:29:07 INF] End processing HTTP request after 198.842ms - 200
[21:29:07 INF] HTTP GET /api/library/license responded 200 in 234.3810 ms
[21:29:07 INF] HTTP GET /api/library/license responded 200 in 234.3810 ms
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 INF] HTTP POST /api/library/artists responded 201 in 14.3972 ms
[21:29:07 INF] HTTP POST /api/library/artists responded 201 in 14.3972 ms
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 INF] Application starting...
[21:29:07 INF] Ensuring bucket exists: audio-files
[21:29:07 INF] Ensuring bucket exists: audio-files
[21:29:07 INF] Bucket ensured: audio-files
[21:29:07 INF] Bucket ensured: audio-files
[21:29:07 INF] Ensuring bucket exists: karaoke-recordings
[21:29:07 INF] Ensuring bucket exists: karaoke-recordings
[21:29:07 INF] Bucket ensured: karaoke-recordings
[21:29:07 INF] Bucket ensured: karaoke-recordings
[21:29:07 INF] Ensuring bucket exists: party-posters
[21:29:07 INF] Ensuring bucket exists: party-posters
[21:29:07 INF] Bucket ensured: party-posters
[21:29:07 INF] Bucket ensured: party-posters
[21:29:07 INF] Setting bucket public: party-posters
[21:29:07 INF] Setting bucket public: party-posters
[21:29:07 INF] HTTP POST /api/user/notifications responded 201 in 137.0574 ms
[21:29:07 INF] HTTP POST /api/user/notifications responded 201 in 137.0574 ms
[21:29:07 INF] HTTP GET /api/password-requirements responded 404 in 48.5375 ms
[21:29:07 INF] HTTP GET /api/password-requirements responded 404 in 48.5375 ms
[21:29:07 INF] Application started
[21:29:07 INF] Application started
[21:29:07 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 35.4489 ms
[21:29:07 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 35.4489 ms
[21:29:07 INF] HTTP POST /api/library/artists/4/facts responded 200 in 113.8593 ms
[21:29:07 INF] HTTP POST /api/library/artists/4/facts responded 200 in 113.8593 ms
Starting AudioVerse.API
[21:29:07 INF] HTTP GET /api/admin/genres/999999 responded 404 in 40.3593 ms
[21:29:07 INF] HTTP GET /api/admin/genres/999999 responded 404 in 40.3593 ms
[21:29:07 INF] HTTP GET /api/library/artists/4/facts responded 200 in 26.9106 ms
[21:29:07 INF] HTTP GET /api/library/artists/4/facts responded 200 in 26.9106 ms
[21:29:07 INF] HTTP POST /api/user/notifications/1/read responded 200 in 32.7971 ms
[21:29:07 INF] HTTP POST /api/user/notifications/1/read responded 200 in 32.7971 ms
[21:29:07 INF] HTTP GET /api/user/notifications responded 200 in 33.8230 ms
[21:29:07 INF] HTTP GET /api/user/notifications responded 200 in 33.8230 ms
[21:29:07 INF] HTTP PUT /api/library/artists/4/detail responded 200 in 57.1172 ms
[21:29:07 INF] HTTP PUT /api/library/artists/4/detail responded 200 in 57.1172 ms
[21:29:07 INF] HTTP DELETE /api/user/notifications/1 responded 204 in 20.4074 ms
[21:29:07 INF] HTTP DELETE /api/user/notifications/1 responded 204 in 20.4074 ms
[21:29:07 INF] HTTP DELETE /api/user/notifications/1 responded 404 in 14.2700 ms
[21:29:07 INF] HTTP DELETE /api/user/notifications/1 responded 404 in 14.2700 ms
[21:29:07 INF] HTTP GET /api/admin/genres responded 200 in 44.2293 ms
[21:29:07 INF] HTTP GET /api/admin/genres responded 200 in 44.2293 ms
[21:29:07 WRN] Failed to download 
System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.
   at System.Net.Http.HttpClient.PrepareRequestMessage(HttpRequestMessage request)
   at System.Net.Http.HttpClient.SendAsync(HttpRequestMessage request, HttpCompletionOption completionOption, CancellationToken cancellationToken)
   at AudioVerse.Application.Services.MediaLibrary.DownloadService.DownloadCoreAsync(String url, String fileName, String subFolder, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Services\MediaLibrary\DownloadService.cs:line 31
[21:29:07 WRN] Failed to download 
System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.
   at System.Net.Http.HttpClient.PrepareRequestMessage(HttpRequestMessage request)
   at System.Net.Http.HttpClient.SendAsync(HttpRequestMessage request, HttpCompletionOption completionOption, CancellationToken cancellationToken)
   at AudioVerse.Application.Services.MediaLibrary.DownloadService.DownloadCoreAsync(String url, String fileName, String subFolder, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Services\MediaLibrary\DownloadService.cs:line 31
[21:29:07 INF] HTTP GET /api/karaoke/events/1 responded 404 in 0.7951 ms
[21:29:07 INF] HTTP GET /api/karaoke/events/1 responded 404 in 0.7951 ms
[21:29:07 INF] HTTP POST /api/library/download/audio responded 400 in 45.9560 ms
[21:29:07 INF] HTTP POST /api/library/download/audio responded 400 in 45.9560 ms
[21:29:07 INF] HTTP POST /api/library/songs responded 201 in 3.2621 ms
[21:29:07 INF] HTTP POST /api/library/songs responded 201 in 3.2621 ms
[21:29:07 INF] HTTP POST /api/games/board responded 201 in 177.1146 ms
[21:29:07 INF] HTTP POST /api/games/board responded 201 in 177.1146 ms
[21:29:07 INF] HTTP PUT /api/library/songs/3 responded 200 in 8.6383 ms
[21:29:07 INF] HTTP PUT /api/library/songs/3 responded 200 in 8.6383 ms
[21:29:07 INF] HTTP GET /api/library/songs/3 responded 200 in 1.2235 ms
[21:29:07 INF] HTTP GET /api/library/songs/3 responded 200 in 1.2235 ms
[21:29:07 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 42.8969 ms
[21:29:07 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 42.8969 ms
[21:29:07 INF] HTTP DELETE /api/library/songs/3 responded 204 in 3.8291 ms
[21:29:07 INF] HTTP DELETE /api/library/songs/3 responded 204 in 3.8291 ms
[21:29:07 INF] HTTP GET /api/library/songs/3 responded 404 in 2.0235 ms
[21:29:07 INF] HTTP GET /api/library/songs/3 responded 404 in 2.0235 ms
[21:29:07 INF] HTTP POST /api/karaoke/ultrastar/convert/lrc responded 200 in 35.3631 ms
[21:29:07 INF] HTTP POST /api/karaoke/ultrastar/convert/lrc responded 200 in 35.3631 ms
[21:29:07 INF] Application started
[21:29:07 INF] Application started
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 56.2132 ms
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 56.2132 ms
[21:29:07 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 53.0495 ms
[21:29:07 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 53.0495 ms
[21:29:07 INF] HTTP POST /api/events/1/board-games responded 201 in 76.5252 ms
[21:29:07 INF] HTTP POST /api/events/1/board-games responded 201 in 76.5252 ms
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 403 in 3.7550 ms
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 403 in 3.7550 ms
[21:29:07 INF] HTTP POST /api/admin/genres responded 201 in 121.9107 ms
[21:29:07 INF] HTTP POST /api/admin/genres responded 201 in 121.9107 ms
[21:29:07 INF] HTTP GET /api/admin/genres/1 responded 200 in 3.6595 ms
[21:29:07 INF] HTTP GET /api/admin/genres/1 responded 200 in 3.6595 ms
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 7.6122 ms
[21:29:07 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 7.6122 ms
[21:29:07 INF] Application started
[21:29:07 INF] Application started
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:07 INF] HTTP GET /api/playlists responded 200 in 84.2358 ms
[21:29:07 INF] HTTP GET /api/playlists responded 200 in 84.2358 ms
[21:29:07 INF] Application starting...
[21:29:07 INF] HTTP PUT /api/admin/genres/1 responded 200 in 40.6322 ms
[21:29:07 INF] HTTP GET /api/genres responded 200 in 27.8622 ms
[21:29:07 INF] HTTP PUT /api/admin/genres/1 responded 200 in 40.6322 ms
[21:29:07 INF] HTTP GET /api/genres responded 200 in 27.8622 ms
[21:29:07 INF] HTTP GET /api/events/1/board-games responded 200 in 98.8556 ms
[21:29:07 INF] HTTP GET /api/events/1/board-games responded 200 in 98.8556 ms
[21:29:07 INF] Ensuring bucket exists: audio-files
[21:29:07 INF] Ensuring bucket exists: audio-files
[21:29:07 INF] HTTP GET /api/dance/styles responded 404 in 2.7775 ms
[21:29:07 INF] HTTP GET /api/dance/styles responded 404 in 2.7775 ms
[21:29:07 INF] Bucket ensured: audio-files
[21:29:07 INF] Bucket ensured: audio-files
[21:29:07 INF] Ensuring bucket exists: karaoke-recordings
[21:29:07 INF] Ensuring bucket exists: karaoke-recordings
[21:29:07 INF] Application started
[21:29:07 INF] Application started
[21:29:07 INF] Bucket ensured: karaoke-recordings
[21:29:07 INF] Bucket ensured: karaoke-recordings
[21:29:07 INF] Ensuring bucket exists: party-posters
[21:29:07 INF] Ensuring bucket exists: party-posters
[21:29:07 INF] Bucket ensured: party-posters
[21:29:07 INF] Bucket ensured: party-posters
[21:29:07 INF] Setting bucket public: party-posters
[21:29:07 INF] Setting bucket public: party-posters
[21:29:07 INF] HTTP POST /api/admin/genres responded 201 in 2.7221 ms
[21:29:07 INF] HTTP POST /api/admin/genres responded 201 in 2.7221 ms
Starting AudioVerse.API
Starting AudioVerse.API
[21:29:07 INF] HTTP DELETE /api/admin/genres/2 responded 204 in 13.9945 ms
[21:29:07 INF] HTTP DELETE /api/admin/genres/2 responded 204 in 13.9945 ms
[21:29:07 INF] Application started
[21:29:07 INF] Application started
Starting AudioVerse.API
[21:29:07 INF] HTTP POST /api/games/video responded 201 in 70.2912 ms
[21:29:07 INF] HTTP POST /api/games/video responded 201 in 70.2912 ms
[21:29:07 INF] HTTP POST /api/events/1/video-games responded 201 in 33.9686 ms
[21:29:07 INF] HTTP POST /api/events/1/video-games responded 201 in 33.9686 ms
[21:29:08 INF] HTTP GET /api/events/1/video-games responded 200 in 44.0224 ms
[21:29:08 INF] HTTP GET /api/events/1/video-games responded 200 in 44.0224 ms
[21:29:08 INF] Application starting...
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Application starting...
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Application starting...
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] HTTP POST /api/events/1/attractions responded 201 in 113.2361 ms
[21:29:08 INF] HTTP POST /api/events/1/attractions responded 201 in 113.2361 ms
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 INF] HTTP GET /api/events/1/attractions responded 200 in 33.0487 ms
[21:29:08 INF] HTTP GET /api/events/1/attractions responded 200 in 33.0487 ms
[21:29:08 INF] HTTP POST /api/events/1/menu responded 201 in 121.7377 ms
[21:29:08 INF] HTTP POST /api/events/1/menu responded 201 in 121.7377 ms
[21:29:08 INF] HTTP GET /api/events/1/menu responded 200 in 36.7379 ms
[21:29:08 INF] HTTP GET /api/events/1/menu responded 200 in 36.7379 ms
[21:29:08 INF] HTTP POST /api/events/1/schedule responded 201 in 107.1064 ms
[21:29:08 INF] HTTP POST /api/events/1/schedule responded 201 in 107.1064 ms
[21:29:08 INF] HTTP GET /api/events/1/schedule responded 200 in 30.8489 ms
[21:29:08 INF] HTTP GET /api/events/1/schedule responded 200 in 30.8489 ms
[21:29:08 INF] Start processing HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[21:29:08 INF] Start processing HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[21:29:08 INF] Sending HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[21:29:08 INF] Sending HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[21:29:08 INF] Application started
[21:29:08 INF] Application started
Starting AudioVerse.API
[21:29:08 INF] HTTP POST /api/leagues responded 201 in 136.0497 ms
[21:29:08 INF] HTTP POST /api/leagues responded 201 in 136.0497 ms
[21:29:08 INF] Received HTTP response headers after 144.109ms - 200
[21:29:08 INF] Received HTTP response headers after 144.109ms - 200
[21:29:08 INF] End processing HTTP request after 144.4157ms - 200
[21:29:08 INF] End processing HTTP request after 144.4157ms - 200
[21:29:08 INF] HTTP GET /api/admin/system-config responded 200 in 88.0920 ms
[21:29:08 INF] HTTP GET /api/admin/system-config responded 200 in 88.0920 ms
[21:29:08 INF] HTTP POST /api/events/locations responded 201 in 279.8989 ms
[21:29:08 INF] HTTP POST /api/events/locations responded 201 in 279.8989 ms
[21:29:08 INF] HTTP GET /api/leagues/1 responded 200 in 104.7510 ms
[21:29:08 INF] HTTP GET /api/leagues/1 responded 200 in 104.7510 ms
[21:29:08 INF] Application starting...
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] Ensuring bucket exists: audio-files
[21:29:08 INF] HTTP PUT /api/admin/system-config responded 200 in 59.5884 ms
[21:29:08 INF] HTTP PUT /api/admin/system-config responded 200 in 59.5884 ms
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Bucket ensured: audio-files
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Bucket ensured: karaoke-recordings
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Ensuring bucket exists: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Bucket ensured: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 INF] Setting bucket public: party-posters
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:08 INF] HTTP GET /api/events/locations responded 200 in 40.0764 ms
[21:29:08 INF] HTTP GET /api/events/locations responded 200 in 40.0764 ms
[21:29:08 INF] HTTP GET /api/betting/events/1/markets responded 200 in 40.6715 ms
[21:29:08 INF] HTTP GET /api/betting/events/1/markets responded 200 in 40.6715 ms
[21:29:08 INF] HTTP GET /api/user/audit-logs responded 200 in 35.1618 ms
[21:29:08 INF] HTTP GET /api/user/audit-logs responded 200 in 35.1618 ms
[21:29:08 INF] HTTP GET /api/leagues responded 200 in 18.3857 ms
[21:29:08 INF] HTTP GET /api/leagues responded 200 in 18.3857 ms
[21:29:08 INF] HTTP GET /api/events/locations/99999 responded 404 in 40.4182 ms
[21:29:08 INF] HTTP GET /api/events/locations/99999 responded 404 in 40.4182 ms
[21:29:08 INF] Application started
[21:29:08 INF] Application started
[21:29:08 INF] HTTP GET /api/user/audit-logs/all responded 200 in 14.3149 ms
[21:29:08 INF] HTTP GET /api/user/audit-logs/all responded 200 in 14.3149 ms
Starting AudioVerse.API
[21:29:08 INF] Application started
[21:29:08 INF] Application started
[21:29:08 INF] HTTP GET /api/betting/users/999/bets responded 200 in 47.3262 ms
[21:29:08 INF] HTTP GET /api/betting/users/999/bets responded 200 in 47.3262 ms
[21:29:08 INF] HTTP GET /api/leagues/99999 responded 404 in 2.5287 ms
[21:29:08 INF] HTTP GET /api/leagues/99999 responded 404 in 2.5287 ms
Starting AudioVerse.API
[21:29:09 INF] HTTP GET /api/organizations responded 200 in 72.9418 ms
[21:29:09 INF] HTTP GET /api/organizations responded 200 in 72.9418 ms
[21:29:09 INF] HTTP GET /api/betting/users/1/bets responded 401 in 0.0805 ms
[21:29:09 INF] HTTP GET /api/betting/users/1/bets responded 401 in 0.0805 ms
[21:29:09 WRN] Health check redis with status Degraded completed after 1.2817ms with message 'Redis not configured.'
[21:29:09 WRN] Health check redis with status Degraded completed after 1.2817ms with message 'Redis not configured.'
[21:29:09 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 97.6819 ms
[21:29:09 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 97.6819 ms
[21:29:09 INF] HTTP GET /health responded 200 in 50.4134 ms
[21:29:09 INF] HTTP GET /health responded 200 in 50.4134 ms
[21:29:09 INF] Application starting...
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:09 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:09 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:09 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] HTTP GET /api/betting/users/999/wallet responded 200 in 77.6643 ms
[21:29:09 INF] HTTP GET /api/betting/users/999/wallet responded 200 in 77.6643 ms
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] HTTP POST /api/events/99999/restore responded 404 in 25.1900 ms
[21:29:09 INF] HTTP POST /api/events/99999/restore responded 404 in 25.1900 ms
[21:29:09 INF] HTTP GET /api/karaoke/rounds/1/players responded 200 in 49.2750 ms
[21:29:09 INF] HTTP GET /api/karaoke/rounds/1/players responded 200 in 49.2750 ms
[21:29:09 INF] Application starting...
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] HTTP POST /api/organizations responded 201 in 43.3380 ms
[21:29:09 INF] HTTP POST /api/organizations responded 201 in 43.3380 ms
[21:29:09 INF] HTTP DELETE /api/events/99999/soft responded 404 in 27.4529 ms
[21:29:09 INF] HTTP DELETE /api/events/99999/soft responded 404 in 27.4529 ms
[21:29:09 INF] HTTP DELETE /api/karaoke/rounds/1/players/1 responded 204 in 41.5481 ms
[21:29:09 INF] HTTP DELETE /api/karaoke/rounds/1/players/1 responded 204 in 41.5481 ms
[21:29:09 INF] HTTP GET /api/organizations/1 responded 200 in 48.9792 ms
[21:29:09 INF] HTTP GET /api/organizations/1 responded 200 in 48.9792 ms
[21:29:09 INF] Application started
[21:29:09 INF] Application started
[21:29:09 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 8.7644 ms
[21:29:09 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 8.7644 ms
Starting AudioVerse.API
[21:29:09 INF] HTTP DELETE /api/karaoke/rounds/1/players/2 responded 403 in 4.0461 ms
[21:29:09 INF] HTTP DELETE /api/karaoke/rounds/1/players/2 responded 403 in 4.0461 ms
[21:29:09 INF] Application started
[21:29:09 INF] Application started
[21:29:09 INF] HTTP POST /api/events responded 201 in 78.1194 ms
[21:29:09 INF] HTTP POST /api/events responded 201 in 78.1194 ms
[21:29:09 INF] HTTP DELETE /api/events/2/soft responded 204 in 13.6225 ms
[21:29:09 INF] HTTP DELETE /api/events/2/soft responded 204 in 13.6225 ms
[21:29:09 INF] Received HTTP response headers after 206.3618ms - 200
[21:29:09 INF] Received HTTP response headers after 206.3618ms - 200
[21:29:09 INF] End processing HTTP request after 206.5904ms - 200
[21:29:09 INF] End processing HTTP request after 206.5904ms - 200
[21:29:09 INF] HTTP POST /api/events/2/restore responded 200 in 16.2362 ms
[21:29:09 INF] HTTP POST /api/events/2/restore responded 200 in 16.2362 ms
[21:29:09 INF] HTTP GET /api/library/license responded 200 in 214.1474 ms
[21:29:09 INF] HTTP GET /api/library/license responded 200 in 214.1474 ms
[21:29:09 INF] HTTP GET /api/library/license responded 400 in 4.1475 ms
[21:29:09 INF] HTTP GET /api/library/license responded 400 in 4.1475 ms
[21:29:09 INF] HTTP GET /api/admin/audit responded 200 in 27.9864 ms
[21:29:09 INF] HTTP GET /api/admin/audit responded 200 in 27.9864 ms
[21:29:09 INF] Application started
[21:29:09 INF] Application started
[21:29:09 INF] HTTP POST /api/events/1/polls responded 201 in 174.5232 ms
[21:29:09 INF] HTTP POST /api/events/1/polls responded 201 in 174.5232 ms
[21:29:09 INF] HTTP GET /api/admin/audit responded 200 in 11.0971 ms
[21:29:09 INF] HTTP GET /api/admin/audit responded 200 in 11.0971 ms
[21:29:09 INF] Application started
[21:29:09 INF] Application started
Starting AudioVerse.API
Starting AudioVerse.API
[21:29:09 INF] Application starting...
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] HTTP GET /api/events/1/polls responded 200 in 64.1144 ms
[21:29:09 INF] HTTP GET /api/events/1/polls responded 200 in 64.1144 ms
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
Starting AudioVerse.API
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 INF] HTTP GET /api/events/1/polls/1 responded 200 in 55.5011 ms
[21:29:09 INF] HTTP GET /api/events/1/polls/1 responded 200 in 55.5011 ms
Starting AudioVerse.API
[21:29:09 INF] HTTP POST /api/events/polls/vote/6a81eff7ff8644218bfd43235ec65771 responded 200 in 59.6654 ms
[21:29:09 INF] HTTP POST /api/events/polls/vote/6a81eff7ff8644218bfd43235ec65771 responded 200 in 59.6654 ms
[21:29:09 INF] Application starting...
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Application starting...
[21:29:09 INF] HTTP GET /api/events/1/polls/1/results responded 200 in 48.2519 ms
[21:29:09 INF] HTTP GET /api/events/1/polls/1/results responded 200 in 48.2519 ms
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Application started
[21:29:09 INF] Application started
[21:29:09 INF] Application starting...
Starting AudioVerse.API
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Application starting...
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Ensuring bucket exists: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Bucket ensured: audio-files
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Bucket ensured: karaoke-recordings
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Ensuring bucket exists: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Bucket ensured: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 INF] Setting bucket public: party-posters
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:09 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 INF] Application starting...
Honey Token created: HTTP - 4cb48d3f-c271-4cfc-b023-b2083ad7db97
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] HTTP POST /api/user/honeytokens/create responded 200 in 86.7263 ms
[21:29:10 INF] HTTP POST /api/user/honeytokens/create responded 200 in 86.7263 ms
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 INF] HTTP GET /api/user/honeytokens/triggered responded 200 in 48.5071 ms
[21:29:10 INF] HTTP GET /api/user/honeytokens/triggered responded 200 in 48.5071 ms
[21:29:10 INF] HTTP POST /api/user/captcha/generate responded 200 in 110.6125 ms
[21:29:10 INF] HTTP POST /api/user/captcha/generate responded 200 in 110.6125 ms
[21:29:10 INF] HTTP GET /api/library/files/audio responded 401 in 0.1975 ms
[21:29:10 INF] HTTP GET /api/library/files/audio responded 401 in 0.1975 ms
[21:29:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 88.5635 ms
[21:29:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 88.5635 ms
[21:29:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 1.4263 ms
[21:29:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 1.4263 ms
[21:29:10 INF] Application started
[21:29:10 INF] Application started
[21:29:10 INF] HTTP GET /api/library/files/audio responded 200 in 43.1231 ms
[21:29:10 INF] HTTP GET /api/library/files/audio responded 200 in 43.1231 ms
Starting AudioVerse.API
[21:29:10 INF] HTTP PUT /api/moderation/admin/report/999999/resolve responded 404 in 41.5403 ms
[21:29:10 INF] HTTP PUT /api/moderation/admin/report/999999/resolve responded 404 in 41.5403 ms
[21:29:10 INF] HTTP GET /api/library/files/audio/1 responded 404 in 31.9349 ms
[21:29:10 INF] HTTP GET /api/library/files/audio/1 responded 404 in 31.9349 ms
[21:29:10 INF] Abuse report created: 1, TargetType: 
[21:29:10 INF] Abuse report created: 1, TargetType: 
[21:29:10 INF] HTTP POST /api/moderation/report responded 200 in 44.1411 ms
[21:29:10 INF] HTTP POST /api/moderation/report responded 200 in 44.1411 ms
[21:29:10 INF] Application starting...
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] HTTP DELETE /api/library/files/audio/1 responded 404 in 36.9618 ms
[21:29:10 INF] HTTP DELETE /api/library/files/audio/1 responded 404 in 36.9618 ms
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 WRN] Failed to send email to user_b0e58363a93b436da4a3ec399f5f668d@test.com
System.Net.Sockets.SocketException (11001): No such host is known.
   at System.Net.NameResolutionPal.ProcessResult(SocketError errorCode, GetAddrInfoExContext* context)
   at System.Net.NameResolutionPal.GetAddressInfoExCallback(Int32 error, Int32 bytes, NativeOverlapped* overlapped)
--- End of stack trace from previous location ---
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, CancellationToken cancellationToken)
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, Int32 timeout, CancellationToken cancellationToken)
   at MailKit.MailService.ConnectNetworkAsync(String host, Int32 port, CancellationToken cancellationToken)
   at MailKit.Net.Smtp.SmtpClient.ConnectAsync(String host, Int32 port, SecureSocketOptions options, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Email.SmtpEmailSender.SendAsync(String to, String subject, String body, Boolean html) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Email\SmtpEmailSender.cs:line 33
[21:29:10 WRN] Failed to send email to user_b0e58363a93b436da4a3ec399f5f668d@test.com
System.Net.Sockets.SocketException (11001): No such host is known.
   at System.Net.NameResolutionPal.ProcessResult(SocketError errorCode, GetAddrInfoExContext* context)
   at System.Net.NameResolutionPal.GetAddressInfoExCallback(Int32 error, Int32 bytes, NativeOverlapped* overlapped)
--- End of stack trace from previous location ---
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, CancellationToken cancellationToken)
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, Int32 timeout, CancellationToken cancellationToken)
   at MailKit.MailService.ConnectNetworkAsync(String host, Int32 port, CancellationToken cancellationToken)
   at MailKit.Net.Smtp.SmtpClient.ConnectAsync(String host, Int32 port, SecureSocketOptions options, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Email.SmtpEmailSender.SendAsync(String to, String subject, String body, Boolean html) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Email\SmtpEmailSender.cs:line 33
[21:29:10 INF] HTTP POST /api/user/register responded 200 in 3261.8913 ms
[21:29:10 INF] HTTP POST /api/user/register responded 200 in 3261.8913 ms
[21:29:10 INF] HTTP GET /api/moderation/admin/reports responded 200 in 43.6357 ms
[21:29:10 INF] HTTP GET /api/moderation/admin/reports responded 200 in 43.6357 ms
[21:29:10 INF] HTTP GET /api/library/files/audio responded 200 in 6.7432 ms
[21:29:10 INF] HTTP GET /api/library/files/audio responded 200 in 6.7432 ms
[21:29:10 INF] Application started
[21:29:10 INF] Application started
Starting AudioVerse.API
[21:29:10 INF] Application started
[21:29:10 INF] Application started
[21:29:10 INF] HTTP POST /api/user/notifications/read-all responded 200 in 43.1783 ms
[21:29:10 INF] HTTP POST /api/user/notifications/read-all responded 200 in 43.1783 ms
Starting AudioVerse.API
[21:29:10 INF] HTTP POST /api/user/notifications responded 201 in 24.9250 ms
[21:29:10 INF] HTTP POST /api/user/notifications responded 201 in 24.9250 ms
[21:29:10 INF] HTTP POST /api/user/login responded 200 in 115.5307 ms
[21:29:10 INF] HTTP POST /api/user/login responded 200 in 115.5307 ms
[21:29:10 INF] HTTP GET /api/user/notifications responded 200 in 13.2454 ms
[21:29:10 INF] HTTP GET /api/user/notifications responded 200 in 13.2454 ms
[21:29:10 INF] HTTP POST /api/user/notifications/99999/read responded 404 in 5.3176 ms
[21:29:10 INF] HTTP POST /api/user/notifications/99999/read responded 404 in 5.3176 ms
[21:29:10 INF] HTTP DELETE /api/user/notifications/99999 responded 404 in 11.8460 ms
[21:29:10 INF] HTTP DELETE /api/user/notifications/99999 responded 404 in 11.8460 ms
[21:29:10 INF] HTTP GET /api/user/notifications responded 401 in 0.0889 ms
[21:29:10 INF] HTTP GET /api/user/notifications responded 401 in 0.0889 ms
[21:29:10 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 5.0906 ms
[21:29:10 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 5.0906 ms
[21:29:10 INF] HTTP POST /api/user/refresh-token responded 200 in 89.1564 ms
[21:29:10 INF] HTTP POST /api/user/refresh-token responded 200 in 89.1564 ms
[21:29:10 INF] Application started
[21:29:10 INF] Application started
Starting AudioVerse.API
[21:29:10 INF] Application starting...
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] HTTP POST /api/user/logout responded 200 in 36.0626 ms
[21:29:10 INF] HTTP POST /api/user/logout responded 200 in 36.0626 ms
[21:29:10 INF] Application starting...
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Ensuring bucket exists: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Bucket ensured: audio-files
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: karaoke-recordings
[21:29:10 INF] HTTP POST /api/user/recaptcha/verify responded 200 in 14.4275 ms
[21:29:10 INF] HTTP POST /api/user/recaptcha/verify responded 200 in 14.4275 ms
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Bucket ensured: karaoke-recordings
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Ensuring bucket exists: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Bucket ensured: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] Setting bucket public: party-posters
[21:29:10 INF] Application started
[21:29:10 INF] Application started
Starting AudioVerse.API
[21:29:11 INF] HTTP DELETE /api/events/1/photos/99999 responded 404 in 27.9984 ms
[21:29:11 INF] HTTP DELETE /api/events/1/photos/99999 responded 404 in 27.9984 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 200 in 63.0815 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 200 in 63.0815 ms
[21:29:11 INF] HTTP POST /api/events/1/comments responded 201 in 108.7529 ms
[21:29:11 INF] HTTP POST /api/events/1/comments responded 201 in 108.7529 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk-revoke responded 200 in 23.0592 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk-revoke responded 200 in 23.0592 ms
[21:29:11 INF] Application starting...
[21:29:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:11 INF] HTTP POST /api/events/1/comments responded 201 in 5.1799 ms
[21:29:11 INF] Ensuring bucket exists: audio-files
[21:29:11 INF] Ensuring bucket exists: audio-files
[21:29:11 INF] Application starting...
[21:29:11 INF] Bucket ensured: audio-files
[21:29:11 INF] Bucket ensured: audio-files
[21:29:11 INF] Ensuring bucket exists: karaoke-recordings
[21:29:11 INF] Ensuring bucket exists: karaoke-recordings
[21:29:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[21:29:11 INF] Ensuring bucket exists: audio-files
[21:29:11 INF] Ensuring bucket exists: audio-files
[21:29:11 INF] Bucket ensured: karaoke-recordings
[21:29:11 INF] Bucket ensured: karaoke-recordings
[21:29:11 INF] Ensuring bucket exists: party-posters
[21:29:11 INF] Ensuring bucket exists: party-posters
[21:29:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 159.9341 ms
[21:29:11 INF] Bucket ensured: audio-files
[21:29:11 INF] Bucket ensured: audio-files
[21:29:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 159.9341 ms
[21:29:11 INF] Ensuring bucket exists: karaoke-recordings
[21:29:11 INF] Ensuring bucket exists: karaoke-recordings
[21:29:11 INF] Bucket ensured: karaoke-recordings
[21:29:11 INF] Bucket ensured: karaoke-recordings
[21:29:11 INF] Ensuring bucket exists: party-posters
[21:29:11 INF] Ensuring bucket exists: party-posters
[21:29:11 INF] Bucket ensured: party-posters
[21:29:11 INF] Bucket ensured: party-posters
[21:29:11 INF] Setting bucket public: party-posters
[21:29:11 INF] Setting bucket public: party-posters
[21:29:11 INF] Bucket ensured: party-posters
[21:29:11 INF] Bucket ensured: party-posters
[21:29:11 INF] Setting bucket public: party-posters
[21:29:11 INF] Setting bucket public: party-posters
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 200 in 87.1367 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 200 in 87.1367 ms
[21:29:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 2.8754 ms
[21:29:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 2.8754 ms
[21:29:11 INF] HTTP GET /api/events/1/photos responded 200 in 115.2503 ms
[21:29:11 INF] HTTP GET /api/events/1/photos responded 200 in 115.2503 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 200 in 24.1341 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 200 in 24.1341 ms
[21:29:11 INF] Application started
[21:29:11 INF] Application started
[21:29:11 INF] HTTP POST /api/events/1/sessions responded 403 in 43.1232 ms
[21:29:11 INF] HTTP POST /api/events/1/sessions responded 403 in 43.1232 ms
[21:29:11 INF] HTTP PATCH /api/karaoke/events/999999/participants/999999/status responded 404 in 56.3302 ms
[21:29:11 INF] HTTP PATCH /api/karaoke/events/999999/participants/999999/status responded 404 in 56.3302 ms
[21:29:11 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 400 in 11.6075 ms
[21:29:11 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 400 in 11.6075 ms
[21:29:11 INF] Application started
[21:29:11 INF] Application started
[21:29:11 INF] HTTP POST /api/events/1/invites responded 403 in 9.9621 ms
[21:29:11 INF] HTTP POST /api/events/1/invites responded 403 in 9.9621 ms
[21:29:11 INF] HTTP POST /api/events/1/participants responded 403 in 22.9618 ms
[21:29:11 INF] HTTP POST /api/events/1/participants responded 403 in 22.9618 ms
[21:29:11 INF] Application started
[21:29:11 INF] Application started
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 403 in 11.7574 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 403 in 11.7574 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 403 in 10.2128 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 403 in 10.2128 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 403 in 12.6696 ms
[21:29:11 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 403 in 12.6696 ms
[21:29:11 INF] Application started
[21:29:11 INF] Application started
[21:29:11 INF] HTTP POST /api/events/1/photos responded 201 in 407.7372 ms
[21:29:11 INF] HTTP POST /api/events/1/photos responded 201 in 407.7372 ms
[21:29:11 INF] HTTP GET /api/events/1/comments responded 200 in 32.6152 ms
[21:29:11 INF] HTTP GET /api/events/1/comments responded 200 in 32.6152 ms
[21:29:11 INF] HTTP POST /api/events/1/comments responded 201 in 4.0273 ms
[21:29:11 INF] HTTP POST /api/events/1/comments responded 201 in 4.0273 ms
[21:29:11 INF] HTTP DELETE /api/events/1/comments/99999 responded 404 in 14.2106 ms
[21:29:11 INF] HTTP DELETE /api/events/1/comments/99999 responded 404 in 14.2106 ms
[21:29:11 INF] Application started
[21:29:11 INF] Application started
[21:29:11 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J195)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:11 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J195)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:11 ERR] HTTP POST /api/events/1/participants responded 500 in 31.2087 ms
[21:29:11 ERR] HTTP POST /api/events/1/participants responded 500 in 31.2087 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 21.0638 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 21.0638 ms
[xUnit.net 00:00:16.51]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Organizer_Can_Delete_Player [FAIL]
[xUnit.net 00:00:16.51]       Assert.True() Failure
[xUnit.net 00:00:16.51]       Expected: True
[xUnit.net 00:00:16.51]       Actual:   False
[xUnit.net 00:00:16.51]       Stack Trace:
[xUnit.net 00:00:16.51]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(46,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Organizer_Can_Delete_Player()
[xUnit.net 00:00:16.51]         --- End of stack trace from previous location ---
[21:29:12 INF] HTTP GET /api/events/1/bouncer/waiting responded 200 in 36.6370 ms
[21:29:12 INF] HTTP GET /api/events/1/bouncer/waiting responded 200 in 36.6370 ms
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J198)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J198)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 7.0515 ms
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 7.0515 ms
[21:29:12 INF] HTTP POST /api/events/1/generate-link responded 200 in 8.9699 ms
[21:29:12 INF] HTTP POST /api/events/1/generate-link responded 200 in 8.9699 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.4465 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.4465 ms
[xUnit.net 00:00:16.56]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Admin_Can_Delete_Player [FAIL]
[xUnit.net 00:00:16.56]       Assert.True() Failure
[xUnit.net 00:00:16.56]       Expected: True
[xUnit.net 00:00:16.56]       Actual:   False
[xUnit.net 00:00:16.56]       Stack Trace:
[xUnit.net 00:00:16.56]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(69,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Admin_Can_Delete_Player()
[xUnit.net 00:00:16.56]         --- End of stack trace from previous location ---
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J19D)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J19D)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 7.3476 ms
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 7.3476 ms
[21:29:12 INF] HTTP GET /api/events/join/5440b5460e4f4bc59044ffa6c2a83b39 responded 200 in 14.0299 ms
[21:29:12 INF] HTTP GET /api/events/join/5440b5460e4f4bc59044ffa6c2a83b39 responded 200 in 14.0299 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 403 in 5.2990 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 403 in 5.2990 ms
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J19G)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJM7RD2J19G)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 4.6938 ms
[21:29:12 ERR] HTTP POST /api/events/1/participants responded 500 in 4.6938 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.2960 ms
[21:29:12 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.2960 ms
[xUnit.net 00:00:16.60]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Owner_Can_Delete_Their_Player [FAIL]
[xUnit.net 00:00:16.60]       Assert.True() Failure
[xUnit.net 00:00:16.60]       Expected: True
[xUnit.net 00:00:16.60]       Actual:   False
[xUnit.net 00:00:16.60]       Stack Trace:
[xUnit.net 00:00:16.60]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(92,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Owner_Can_Delete_Their_Player()
[21:29:12 INF] Application started
[xUnit.net 00:00:16.60]         --- End of stack trace from previous location ---
[21:29:12 INF] Application started
[21:29:12 INF] HTTP GET /api/admin/dashboard responded 200 in 42.5223 ms
[21:29:12 INF] HTTP GET /api/admin/dashboard responded 200 in 42.5223 ms
[21:29:12 INF] HTTP GET /api/events/join/nonexistenttoken12345 responded 404 in 1.8316 ms
[21:29:12 INF] HTTP GET /api/events/join/nonexistenttoken12345 responded 404 in 1.8316 ms
[21:29:12 INF] HTTP POST /api/games/board/collections responded 201 in 77.8511 ms
[21:29:12 INF] HTTP POST /api/games/board/collections responded 201 in 77.8511 ms
[21:29:12 INF] HTTP GET /api/admin/events responded 200 in 41.1543 ms
[21:29:12 INF] HTTP GET /api/admin/events responded 200 in 41.1543 ms
[21:29:12 INF] Application started
[21:29:12 INF] Application started
[21:29:12 INF] HTTP GET /api/games/board/collections/1 responded 200 in 56.3329 ms
[21:29:12 INF] HTTP GET /api/games/board/collections/1 responded 200 in 56.3329 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/99999 responded 404 in 26.8062 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/99999 responded 404 in 26.8062 ms
[21:29:12 INF] HTTP POST /api/dmx/scenes responded 201 in 23.2149 ms
[21:29:12 INF] HTTP POST /api/dmx/scenes responded 201 in 23.2149 ms
[21:29:12 INF] HTTP GET /api/games/board/collections/owner/1 responded 200 in 17.5226 ms
[21:29:12 INF] HTTP GET /api/games/board/collections/owner/1 responded 200 in 17.5226 ms
[21:29:12 INF] HTTP GET /api/dmx/scenes responded 200 in 9.1436 ms
[21:29:12 INF] HTTP GET /api/dmx/scenes responded 200 in 9.1436 ms
[21:29:12 INF] HTTP PUT /api/games/board/collections/1 responded 200 in 35.2414 ms
[21:29:12 INF] HTTP PUT /api/games/board/collections/1 responded 200 in 35.2414 ms
[21:29:12 INF] HTTP DELETE /api/games/board/collections/1 responded 204 in 7.7799 ms
[21:29:12 INF] HTTP DELETE /api/games/board/collections/1 responded 204 in 7.7799 ms
[21:29:12 INF] HTTP POST /api/dmx/scenes/1/apply responded 200 in 40.0628 ms
[21:29:12 INF] HTTP POST /api/dmx/scenes/1/apply responded 200 in 40.0628 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 66.7911 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 66.7911 ms
[21:29:12 INF] HTTP POST /api/games/video responded 201 in 27.9890 ms
[21:29:12 INF] HTTP POST /api/games/video responded 201 in 27.9890 ms
[21:29:12 INF] HTTP POST /api/editor/effects responded 201 in 35.2773 ms
[21:29:12 INF] HTTP POST /api/editor/effects responded 201 in 35.2773 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 34.7401 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 34.7401 ms
[21:29:12 INF] HTTP GET /api/editor/effects responded 200 in 10.2061 ms
[21:29:12 INF] HTTP GET /api/editor/effects responded 200 in 10.2061 ms
[21:29:12 INF] HTTP DELETE /api/library/soundfonts/99999 responded 404 in 6.1276 ms
[21:29:12 INF] HTTP DELETE /api/library/soundfonts/99999 responded 404 in 6.1276 ms
[21:29:12 INF] HTTP POST /api/games/video/sessions responded 201 in 22.7445 ms
[21:29:12 INF] HTTP POST /api/games/video/sessions responded 201 in 22.7445 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 3.0278 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 3.0278 ms
[21:29:12 INF] HTTP POST /api/dmx/sequences responded 201 in 15.6804 ms
[21:29:12 INF] HTTP POST /api/dmx/sequences responded 201 in 15.6804 ms
[21:29:12 INF] HTTP PUT /api/library/soundfonts/2 responded 200 in 11.3210 ms
[21:29:12 INF] HTTP PUT /api/library/soundfonts/2 responded 200 in 11.3210 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/2 responded 200 in 2.9431 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/2 responded 200 in 2.9431 ms
[21:29:12 INF] HTTP GET /api/games/video/sessions/event/1 responded 200 in 23.0059 ms
[21:29:12 INF] HTTP GET /api/games/video/sessions/event/1 responded 200 in 23.0059 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 401 in 0.0763 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 401 in 0.0763 ms
[21:29:12 INF] HTTP GET /api/dmx/sequences responded 200 in 16.0518 ms
[21:29:12 INF] HTTP GET /api/dmx/sequences responded 200 in 16.0518 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 3.9575 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 3.9575 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/3 responded 200 in 1.3401 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/3 responded 200 in 1.3401 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 2.5174 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 2.5174 ms
[21:29:12 INF] HTTP GET /api/games/video/sessions/1 responded 200 in 38.6646 ms
[21:29:12 INF] HTTP GET /api/games/video/sessions/1 responded 200 in 38.6646 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 10.7642 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 10.7642 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 2.7193 ms
[21:29:12 INF] HTTP POST /api/library/soundfonts responded 201 in 2.7193 ms
[21:29:12 INF] HTTP POST /api/games/video/sessions/1/players responded 201 in 14.6080 ms
[21:29:12 INF] HTTP POST /api/games/video/sessions/1/players responded 201 in 14.6080 ms
[21:29:12 INF] HTTP POST /api/editor/project/1/collaborators responded 200 in 43.6810 ms
[21:29:12 INF] HTTP POST /api/editor/project/1/collaborators responded 200 in 43.6810 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/5/files responded 200 in 9.6448 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts/5/files responded 200 in 9.6448 ms
[21:29:12 INF] HTTP PATCH /api/games/video/session-players/1/score responded 200 in 10.9601 ms
[21:29:12 INF] HTTP PATCH /api/games/video/session-players/1/score responded 200 in 10.9601 ms
[21:29:12 INF] HTTP GET /api/editor/project/1/collaborators responded 200 in 12.6257 ms
[21:29:12 INF] HTTP GET /api/editor/project/1/collaborators responded 200 in 12.6257 ms
[21:29:12 WRN] Health check redis with status Degraded completed after 0.0596ms with message 'Redis not configured.'
[21:29:12 WRN] Health check redis with status Degraded completed after 0.0596ms with message 'Redis not configured.'
[21:29:12 INF] HTTP DELETE /api/games/video/session-players/1 responded 204 in 6.8706 ms
[21:29:12 INF] HTTP DELETE /api/games/video/session-players/1 responded 204 in 6.8706 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 10.3653 ms
[21:29:12 INF] HTTP GET /api/library/soundfonts responded 200 in 10.3653 ms
[21:29:12 INF] HTTP GET /health responded 200 in 4.7853 ms
[21:29:12 INF] HTTP GET /health responded 200 in 4.7853 ms
[21:29:12 INF] Application started
[21:29:12 INF] Application started
[21:29:12 INF] HTTP DELETE /api/games/video/sessions/1 responded 204 in 11.3763 ms
[21:29:12 INF] HTTP DELETE /api/games/video/sessions/1 responded 204 in 11.3763 ms
[21:29:12 INF] HTTP POST /api/editor/project/1/export responded 200 in 19.6641 ms
[21:29:12 INF] HTTP POST /api/editor/project/1/export responded 200 in 19.6641 ms
[21:29:12 INF] HTTP POST /api/games/video/collections responded 201 in 23.3079 ms
[21:29:12 INF] HTTP POST /api/games/video/collections responded 201 in 23.3079 ms
[21:29:12 INF] HTTP GET /api/games/video/collections/1 responded 200 in 28.8357 ms
[21:29:12 INF] HTTP GET /api/games/video/collections/1 responded 200 in 28.8357 ms
[21:29:12 INF] HTTP GET /api/games/video/collections/owner/1 responded 200 in 13.3709 ms
[21:29:12 INF] HTTP GET /api/games/video/collections/owner/1 responded 200 in 13.3709 ms
[21:29:12 INF] HTTP PUT /api/games/video/collections/1 responded 200 in 11.0062 ms
[21:29:12 INF] HTTP PUT /api/games/video/collections/1 responded 200 in 11.0062 ms
[21:29:12 INF] HTTP DELETE /api/games/video/collections/1 responded 204 in 6.7248 ms
[21:29:12 INF] HTTP DELETE /api/games/video/collections/1 responded 204 in 6.7248 ms
[21:29:12 INF] HTTP POST /api/games/board/sessions responded 201 in 6.8555 ms
[21:29:12 INF] HTTP POST /api/games/board/sessions responded 201 in 6.8555 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 6.6688 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 6.6688 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/1 responded 200 in 21.6132 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/1 responded 200 in 21.6132 ms
[21:29:12 INF] HTTP POST /api/games/board/sessions/1/rounds responded 201 in 16.3055 ms
[21:29:12 INF] HTTP POST /api/games/board/sessions/1/rounds responded 201 in 16.3055 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/1/rounds responded 200 in 21.1544 ms
[21:29:12 INF] HTTP GET /api/games/board/sessions/1/rounds responded 200 in 21.1544 ms
[21:29:12 INF] HTTP POST /api/games/board/rounds/1/parts responded 201 in 15.1971 ms
[21:29:12 INF] HTTP POST /api/games/board/rounds/1/parts responded 201 in 15.1971 ms
[21:29:12 INF] HTTP POST /api/games/board/parts/1/players responded 201 in 12.9714 ms
[21:29:12 INF] HTTP POST /api/games/board/parts/1/players responded 201 in 12.9714 ms
[21:29:12 INF] HTTP PATCH /api/games/board/part-players/1/score responded 200 in 11.5261 ms
[21:29:12 INF] HTTP PATCH /api/games/board/part-players/1/score responded 200 in 11.5261 ms
[21:29:12 INF] HTTP DELETE /api/games/board/part-players/1 responded 204 in 6.4580 ms
[21:29:12 INF] HTTP DELETE /api/games/board/part-players/1 responded 204 in 6.4580 ms
[21:29:12 INF] HTTP DELETE /api/games/board/parts/1 responded 204 in 11.0708 ms
[21:29:12 INF] HTTP DELETE /api/games/board/parts/1 responded 204 in 11.0708 ms
[21:29:12 INF] HTTP DELETE /api/games/board/rounds/1 responded 204 in 10.4382 ms
[21:29:12 INF] HTTP DELETE /api/games/board/rounds/1 responded 204 in 10.4382 ms
[21:29:12 INF] HTTP DELETE /api/games/board/sessions/1 responded 204 in 9.2350 ms
[21:29:12 INF] HTTP DELETE /api/games/board/sessions/1 responded 204 in 9.2350 ms
[21:29:12 INF] Application started
[21:29:12 INF] Application started
[21:29:13 INF] HTTP GET /api/editor/export/1/status responded 200 in 7.0106 ms
[21:29:13 INF] HTTP GET /api/editor/export/1/status responded 200 in 7.0106 ms
[21:29:13 INF] Application started
[21:29:13 INF] Application started
[xUnit.net 00:00:18.00]   Finished:    AudioVerse.Tests
========== Test run finished: 373 Tests (360 Passed, 13 Failed, 0 Skipped) run in 18 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.66]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.71]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 1.4 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.34]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.40]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 777.7 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.44]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.49]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 889.4 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.63]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.68]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 1.4 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.42]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.47]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 1 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.40]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.45]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 841.7 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.72]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.78]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 1.8 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.68]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.73]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 1.4 sec ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.40]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.45]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 854.8 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.48]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.52]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 916.5 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.47]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.52]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 994 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.35]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.40]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 373 Tests found in 802.8 ms ==========
========== Starting test discovery ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.09]   Discovering: AudioVerse.Tests
[xUnit.net 00:00:00.14]   Discovered:  AudioVerse.Tests
========== Test discovery finished: 412 Tests found in 687.9 ms ==========
Building Test Projects
Executing all tests in project: AudioVerse.Tests
========== Starting test run ==========
[xUnit.net 00:00:00.00] xUnit.net VSTest Adapter v3.1.5+1b188a7b0a (64-bit .NET 10.0.3)
[xUnit.net 00:00:00.11]   Starting:    AudioVerse.Tests
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[12:07:02 INF] Application starting...
[xUnit.net 00:00:04.87]     AudioVerse.Tests.Integration.LicenseIntegrationTests.GetLicense_WithParams_ReturnsOk [FAIL]
[xUnit.net 00:00:04.87]       System.InvalidOperationException : The logger is already frozen.
Starting AudioVerse.API
Starting AudioVerse.API
[xUnit.net 00:00:04.87]       Stack Trace:
Starting AudioVerse.API
Starting AudioVerse.API
Starting AudioVerse.API
[xUnit.net 00:00:04.87]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.87]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.87]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.87]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.87]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.87]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.87]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.87]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.87]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.87]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.87]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
Starting AudioVerse.API
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.87]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.87]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\LicenseIntegrationTests.cs(15,0): at AudioVerse.Tests.Integration.LicenseIntegrationTests.CreateAuthClient()
[xUnit.net 00:00:04.87]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\LicenseIntegrationTests.cs(23,0): at AudioVerse.Tests.Integration.LicenseIntegrationTests.GetLicense_WithParams_ReturnsOk()
[xUnit.net 00:00:04.87]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]     AudioVerse.Tests.Integration.PollsIntegrationTests.CreatePoll_And_Vote_ReturnsResults [FAIL]
[xUnit.net 00:00:04.88]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.88]       Stack Trace:
[xUnit.net 00:00:04.88]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.88]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.88]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\PollsIntegrationTests.cs(18,0): at AudioVerse.Tests.Integration.PollsIntegrationTests.Setup()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\PollsIntegrationTests.cs(30,0): at AudioVerse.Tests.Integration.PollsIntegrationTests.CreatePoll_And_Vote_ReturnsResults()
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]     AudioVerse.Tests.Integration.EventSubResourcesIntegrationTests.BoardGames_CreateAndAssignToEvent [FAIL]
[xUnit.net 00:00:04.88]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.88]       Stack Trace:
[xUnit.net 00:00:04.88]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.88]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.88]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventSubResourcesIntegrationTests.cs(18,0): at AudioVerse.Tests.Integration.EventSubResourcesIntegrationTests.Setup()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventSubResourcesIntegrationTests.cs(78,0): at AudioVerse.Tests.Integration.EventSubResourcesIntegrationTests.BoardGames_CreateAndAssignToEvent()
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]     AudioVerse.Tests.Integration.HoneyTokenCaptchaIntegrationTests.HoneyToken_Create_And_GetTriggered [FAIL]
[xUnit.net 00:00:04.88]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.88]       Stack Trace:
[xUnit.net 00:00:04.88]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.88]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.88]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\HoneyTokenCaptchaIntegrationTests.cs(31,0): at AudioVerse.Tests.Integration.HoneyTokenCaptchaIntegrationTests.HoneyToken_Create_And_GetTriggered()
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]     AudioVerse.Tests.Integration.EditorAndDmxIntegrationTests.DmxScenes_CRUD_And_Apply [FAIL]
[xUnit.net 00:00:04.88]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.88]       Stack Trace:
[xUnit.net 00:00:04.88]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.88]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.88]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EditorAndDmxIntegrationTests.cs(18,0): at AudioVerse.Tests.Integration.EditorAndDmxIntegrationTests.AuthClient()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EditorAndDmxIntegrationTests.cs(91,0): at AudioVerse.Tests.Integration.EditorAndDmxIntegrationTests.DmxScenes_CRUD_And_Apply()
[xUnit.net 00:00:04.88]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.88]     AudioVerse.Tests.Integration.PermissionsNegativeTests.NonOrganizer_Cannot_Grant_Permission [FAIL]
[xUnit.net 00:00:04.88]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:04.88]       Stack Trace:
[xUnit.net 00:00:04.88]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:04.88]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:04.88]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:04.88]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:04.88]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:04.89]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:04.89]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:04.89]         --- End of stack trace from previous location ---
[xUnit.net 00:00:04.89]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:04.89]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:04.89]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:04.89]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\PermissionsNegativeTests.cs(19,0): at AudioVerse.Tests.Integration.PermissionsNegativeTests.NonOrganizer_Cannot_Grant_Permission()
[xUnit.net 00:00:04.89]         --- End of stack trace from previous location ---
[xUnit.net 00:00:05.02]     AudioVerse.Tests.Integration.SoundfontIntegrationTests.GetById_NotFound [FAIL]
[xUnit.net 00:00:05.02]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:05.02]       Stack Trace:
[xUnit.net 00:00:05.02]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:05.02]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.02]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.02]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.02]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.02]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:05.02]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:05.02]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:05.02]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:05.02]         --- End of stack trace from previous location ---
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:05.02]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:05.02]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\SoundfontIntegrationTests.cs(16,0): at AudioVerse.Tests.Integration.SoundfontIntegrationTests.AuthClient()
[xUnit.net 00:00:05.02]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\SoundfontIntegrationTests.cs(33,0): at AudioVerse.Tests.Integration.SoundfontIntegrationTests.GetById_NotFound()
[xUnit.net 00:00:05.02]         --- End of stack trace from previous location ---
[xUnit.net 00:00:05.02]     AudioVerse.Tests.Integration.NotificationsIntegrationTests.MarkAllAsRead_ReturnsOk [FAIL]
[xUnit.net 00:00:05.02]       System.InvalidOperationException : The logger is already frozen.
[xUnit.net 00:00:05.02]       Stack Trace:
[xUnit.net 00:00:05.02]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:05.02]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.02]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.02]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.03]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.03]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.03]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.04]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:05.04]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:05.04]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:05.04]         --- End of stack trace from previous location ---
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\NotificationsIntegrationTests.cs(17,0): at AudioVerse.Tests.Integration.NotificationsIntegrationTests.AuthClient()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\NotificationsIntegrationTests.cs(74,0): at AudioVerse.Tests.Integration.NotificationsIntegrationTests.MarkAllAsRead_ReturnsOk()
[xUnit.net 00:00:05.04]         --- End of stack trace from previous location ---
Starting AudioVerse.API
[xUnit.net 00:00:05.04]     AudioVerse.Tests.Integration.PasswordRequirementsIntegrationTests.GetPasswordRequirements_ReturnsOkOrNotFound [FAIL]
[xUnit.net 00:00:05.04]       System.InvalidOperationException : The logger is already frozen.
Starting AudioVerse.API
[xUnit.net 00:00:05.04]       Stack Trace:
[xUnit.net 00:00:05.04]            at Serilog.Extensions.Hosting.ReloadableLogger.Freeze()
[xUnit.net 00:00:05.04]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__0(IServiceProvider services)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.04]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.ServiceProviderEngineScope.GetService(Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.04]            at Serilog.SerilogServiceCollectionExtensions.<>c__DisplayClass3_0.<AddSerilog>b__2(IServiceProvider services)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitConstructor(ConstructorCallSite constructorCallSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.04]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostBuilder.<>c__DisplayClass36_0.<PopulateServiceCollection>b__2(IServiceProvider _)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.VisitRootCache(ServiceCallSite callSite, RuntimeResolverContext context)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceLookup.CallSiteRuntimeResolver.Resolve(ServiceCallSite callSite, ServiceProviderEngineScope scope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.CreateServiceAccessor(ServiceIdentifier serviceIdentifier)
[xUnit.net 00:00:05.04]            at System.Collections.Concurrent.ConcurrentDictionary`2.GetOrAdd(TKey key, Func`2 valueFactory)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(ServiceIdentifier serviceIdentifier, ServiceProviderEngineScope serviceProviderEngineScope)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProvider.GetService(Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService(IServiceProvider provider, Type serviceType)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.DependencyInjection.ServiceProviderServiceExtensions.GetRequiredService[T](IServiceProvider provider)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostBuilder.ResolveHost(IServiceProvider serviceProvider, DiagnosticListener diagnosticListener)
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostApplicationBuilder.Build()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Builder.WebApplicationBuilder.Build()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Program.cs(419,0): at AudioVerse.API.Program.Main(String[] args)
[xUnit.net 00:00:05.04]            at InvokeStub_Program.Main(Object, Span`1)
[xUnit.net 00:00:05.04]            at System.Reflection.MethodBaseInvoker.InvokeWithOneArg(Object obj, BindingFlags invokeAttr, Binder binder, Object[] parameters, CultureInfo culture)
[xUnit.net 00:00:05.04]         --- End of stack trace from previous location ---
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostFactoryResolver.HostingListener.CreateHost()
[xUnit.net 00:00:05.04]            at Microsoft.Extensions.Hosting.HostFactoryResolver.<>c__DisplayClass10_0.<ResolveHostFactory>b__0(String[] args)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.DeferredHostBuilder.Build()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateHost(IHostBuilder builder)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.ConfigureHostBuilder(IHostBuilder hostBuilder)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.StartServer()
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(DelegatingHandler[] handlers)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateDefaultClient(Uri baseAddress, DelegatingHandler[] handlers)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient(WebApplicationFactoryClientOptions options)
[xUnit.net 00:00:05.04]            at Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory`1.CreateClient()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\PasswordRequirementsIntegrationTests.cs(14,0): at AudioVerse.Tests.Integration.PasswordRequirementsIntegrationTests.CreateClient()
[xUnit.net 00:00:05.04]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\PasswordRequirementsIntegrationTests.cs(22,0): at AudioVerse.Tests.Integration.PasswordRequirementsIntegrationTests.GetPasswordRequirements_ReturnsOkOrNotFound()
[xUnit.net 00:00:05.04]         --- End of stack trace from previous location ---
Starting AudioVerse.API
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Application starting...
[12:07:04 INF] Application starting...
[12:07:04 INF] Application starting...
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Application starting...
[12:07:04 INF] Application starting...
[12:07:04 INF] Application starting...
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Application starting...
[12:07:04 INF] Application starting...
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Application starting...
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Ensuring bucket exists: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Bucket ensured: audio-files
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Bucket ensured: karaoke-recordings
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Ensuring bucket exists: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Bucket ensured: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:04 INF] Setting bucket public: party-posters
[12:07:10 WRN] Health check redis with status Degraded completed after 1.8477ms with message 'Redis not configured.'
[12:07:10 WRN] Health check redis with status Degraded completed after 1.8477ms with message 'Redis not configured.'
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 INF] HTTP GET /health responded 200 in 106.2833 ms
[12:07:10 INF] HTTP GET /health responded 200 in 106.2833 ms
[12:07:10 INF] HTTP GET /api/library/license responded 400 in 81.5240 ms
[12:07:10 INF] HTTP GET /api/library/license responded 400 in 81.5240 ms
[12:07:10 INF] HTTP POST /api/user/notifications responded 201 in 93.6139 ms
[12:07:10 INF] HTTP POST /api/user/notifications responded 201 in 93.6139 ms
[12:07:10 INF] Application started
[12:07:10 INF] Application started
[12:07:10 INF] HTTP POST /api/editor/effects responded 201 in 124.7664 ms
[12:07:10 INF] HTTP POST /api/editor/effects responded 201 in 124.7664 ms
Starting AudioVerse.API
[12:07:10 INF] HTTP POST /api/events/99999/restore responded 404 in 48.6795 ms
[12:07:10 INF] HTTP POST /api/events/99999/restore responded 404 in 48.6795 ms
[12:07:10 INF] HTTP GET /api/user/notifications responded 200 in 19.7217 ms
[12:07:10 INF] HTTP GET /api/user/notifications responded 200 in 19.7217 ms
[12:07:10 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 403 in 153.0267 ms
[12:07:10 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 403 in 153.0267 ms
[12:07:10 INF] HTTP GET /api/editor/effects responded 200 in 15.1533 ms
[12:07:10 INF] HTTP GET /api/editor/effects responded 200 in 15.1533 ms
[12:07:10 INF] HTTP POST /api/user/captcha/generate responded 200 in 204.7473 ms
[12:07:10 INF] HTTP POST /api/user/captcha/generate responded 200 in 204.7473 ms
[12:07:10 INF] HTTP POST /api/library/soundfonts responded 201 in 201.6002 ms
[12:07:10 INF] HTTP POST /api/library/soundfonts responded 201 in 201.6002 ms
[12:07:10 INF] HTTP DELETE /api/events/99999/soft responded 404 in 52.5868 ms
[12:07:10 INF] HTTP DELETE /api/events/99999/soft responded 404 in 52.5868 ms
[12:07:10 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 403 in 47.6013 ms
[12:07:10 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 403 in 47.6013 ms
[12:07:10 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 233.9269 ms
[12:07:10 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 233.9269 ms
[12:07:10 INF] HTTP POST /api/user/notifications/99999/read responded 404 in 51.9504 ms
[12:07:10 INF] HTTP POST /api/user/notifications/99999/read responded 404 in 51.9504 ms
[12:07:10 INF] Application started
[12:07:10 INF] Application started
[12:07:10 INF] HTTP POST /api/dmx/sequences responded 201 in 61.2788 ms
[12:07:10 INF] HTTP POST /api/dmx/sequences responded 201 in 61.2788 ms
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:10 INF] Application starting...
[12:07:10 INF] Ensuring bucket exists: audio-files
[12:07:10 INF] Ensuring bucket exists: audio-files
Starting AudioVerse.API
[12:07:10 INF] Bucket ensured: audio-files
[12:07:10 INF] Bucket ensured: audio-files
[12:07:10 INF] Ensuring bucket exists: karaoke-recordings
[12:07:10 INF] Ensuring bucket exists: karaoke-recordings
[12:07:10 INF] Bucket ensured: karaoke-recordings
[12:07:10 INF] Bucket ensured: karaoke-recordings
[12:07:10 INF] Ensuring bucket exists: party-posters
[12:07:10 INF] HTTP DELETE /api/user/notifications/99999 responded 404 in 32.7180 ms
[12:07:10 INF] Ensuring bucket exists: party-posters
[12:07:10 INF] HTTP DELETE /api/user/notifications/99999 responded 404 in 32.7180 ms
[12:07:10 INF] Bucket ensured: party-posters
[12:07:10 INF] Bucket ensured: party-posters
[12:07:10 INF] Setting bucket public: party-posters
[12:07:10 INF] Setting bucket public: party-posters
[12:07:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 112.2800 ms
[12:07:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 112.2800 ms
[12:07:10 INF] HTTP GET /api/karaoke/rounds/1/players responded 200 in 49.2973 ms
[12:07:10 INF] HTTP GET /api/karaoke/rounds/1/players responded 200 in 49.2973 ms
[12:07:10 INF] HTTP GET /api/user/notifications responded 401 in 3.4747 ms
[12:07:10 INF] HTTP GET /api/user/notifications responded 401 in 3.4747 ms
[12:07:10 INF] HTTP GET /api/library/soundfonts responded 200 in 70.8945 ms
[12:07:10 INF] HTTP GET /api/library/soundfonts responded 200 in 70.8945 ms
[12:07:10 INF] HTTP GET /api/dmx/sequences responded 200 in 39.2575 ms
[12:07:10 INF] HTTP GET /api/dmx/sequences responded 200 in 39.2575 ms
[12:07:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 8.6107 ms
[12:07:10 INF] HTTP POST /api/user/captcha/validate responded 200 in 8.6107 ms
[12:07:10 INF] Application started
[12:07:10 INF] Application started
Starting AudioVerse.API
[12:07:11 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 37.6464 ms
[12:07:11 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 37.6464 ms
[12:07:11 INF] HTTP POST /api/events responded 201 in 113.8830 ms
[12:07:11 INF] HTTP POST /api/events responded 201 in 113.8830 ms
[12:07:11 INF] Application started
[12:07:11 INF] Application started
[12:07:11 INF] HTTP DELETE /api/events/2/soft responded 204 in 9.9820 ms
[12:07:11 INF] HTTP DELETE /api/events/2/soft responded 204 in 9.9820 ms
[12:07:11 INF] HTTP POST /api/events/2/restore responded 200 in 3.4834 ms
[12:07:11 INF] HTTP POST /api/events/2/restore responded 200 in 3.4834 ms
[12:07:11 INF] HTTP DELETE /api/karaoke/rounds/1/players/1 responded 204 in 78.6558 ms
[12:07:11 INF] HTTP DELETE /api/karaoke/rounds/1/players/1 responded 204 in 78.6558 ms
[12:07:11 INF] HTTP DELETE /api/library/soundfonts/99999 responded 404 in 54.1989 ms
[12:07:11 INF] HTTP DELETE /api/library/soundfonts/99999 responded 404 in 54.1989 ms
[12:07:11 INF] HTTP POST /api/games/video responded 201 in 423.1449 ms
[12:07:11 INF] HTTP POST /api/games/video responded 201 in 423.1449 ms
[12:07:11 INF] HTTP POST /api/editor/project/1/collaborators responded 200 in 66.5646 ms
[12:07:11 INF] HTTP POST /api/editor/project/1/collaborators responded 200 in 66.5646 ms
[12:07:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 5.4542 ms
[12:07:11 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 5.4542 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 10.9634 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 10.9634 ms
[12:07:11 INF] HTTP DELETE /api/karaoke/rounds/1/players/2 responded 403 in 2.7859 ms
[12:07:11 INF] HTTP DELETE /api/karaoke/rounds/1/players/2 responded 403 in 2.7859 ms
[12:07:11 INF] HTTP GET /api/admin/audit responded 200 in 37.9868 ms
[12:07:11 INF] HTTP GET /api/admin/audit responded 200 in 37.9868 ms
[12:07:11 INF] Application started
[12:07:11 INF] Application started
Starting AudioVerse.API
[12:07:11 INF] HTTP GET /api/editor/project/1/collaborators responded 200 in 51.7112 ms
[12:07:11 INF] HTTP GET /api/editor/project/1/collaborators responded 200 in 51.7112 ms
[12:07:11 INF] HTTP PUT /api/library/soundfonts/2 responded 200 in 43.8952 ms
[12:07:11 INF] HTTP PUT /api/library/soundfonts/2 responded 200 in 43.8952 ms
[12:07:11 WRN] Health check redis with status Degraded completed after 0.0511ms with message 'Redis not configured.'
[12:07:11 WRN] Health check redis with status Degraded completed after 0.0511ms with message 'Redis not configured.'
[12:07:11 INF] HTTP POST /api/events/1/video-games responded 201 in 73.0908 ms
[12:07:11 INF] HTTP POST /api/events/1/video-games responded 201 in 73.0908 ms
[12:07:11 INF] HTTP GET /api/admin/audit responded 200 in 13.2097 ms
[12:07:11 INF] HTTP GET /api/admin/audit responded 200 in 13.2097 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts/2 responded 200 in 9.0287 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts/2 responded 200 in 9.0287 ms
[12:07:11 INF] HTTP GET /health responded 200 in 23.0280 ms
[12:07:11 INF] HTTP GET /health responded 200 in 23.0280 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 401 in 0.2079 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 401 in 0.2079 ms
[12:07:11 INF] Application started
[12:07:11 INF] Application started
Starting AudioVerse.API
[12:07:11 INF] Application starting...
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 INF] HTTP GET /api/events/1/video-games responded 200 in 68.0645 ms
[12:07:11 INF] HTTP GET /api/events/1/video-games responded 200 in 68.0645 ms
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Application starting...
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 28.6459 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 28.6459 ms
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] HTTP GET /api/library/soundfonts/3 responded 200 in 3.7570 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts/3 responded 200 in 3.7570 ms
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] HTTP POST /api/editor/project/1/export responded 200 in 85.4611 ms
[12:07:11 INF] HTTP POST /api/editor/project/1/export responded 200 in 85.4611 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 7.6716 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 7.6716 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 200 in 42.9259 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 200 in 42.9259 ms
[12:07:11 INF] HTTP POST /api/events/1/attractions responded 201 in 87.6273 ms
[12:07:11 INF] HTTP POST /api/events/1/attractions responded 201 in 87.6273 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 7.6393 ms
[12:07:11 INF] HTTP POST /api/library/soundfonts responded 201 in 7.6393 ms
[12:07:11 INF] Application starting...
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 INF] HTTP GET /api/events/1/attractions responded 200 in 55.7374 ms
[12:07:11 INF] HTTP GET /api/events/1/attractions responded 200 in 55.7374 ms
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] HTTP GET /api/library/soundfonts/5/files responded 200 in 18.4364 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts/5/files responded 200 in 18.4364 ms
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 200 in 26.8569 ms
[12:07:11 INF] HTTP GET /api/library/soundfonts responded 200 in 26.8569 ms
[12:07:11 INF] Application started
[12:07:11 INF] Application started
Starting AudioVerse.API
[12:07:11 INF] HTTP POST /api/events/1/menu responded 201 in 57.5427 ms
[12:07:11 INF] HTTP POST /api/events/1/menu responded 201 in 57.5427 ms
[12:07:11 INF] HTTP GET /api/events/1/menu responded 200 in 37.6859 ms
[12:07:11 INF] HTTP GET /api/events/1/menu responded 200 in 37.6859 ms
[12:07:11 INF] HTTP POST /api/events/1/schedule responded 201 in 60.6921 ms
[12:07:11 INF] HTTP POST /api/events/1/schedule responded 201 in 60.6921 ms
[12:07:11 INF] Application starting...
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] HTTP GET /api/events/1/schedule responded 200 in 52.0689 ms
[12:07:11 INF] HTTP GET /api/events/1/schedule responded 200 in 52.0689 ms
[12:07:11 INF] Application starting...
[12:07:11 INF] Application started
[12:07:11 INF] Application started
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Ensuring bucket exists: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Bucket ensured: audio-files
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Bucket ensured: karaoke-recordings
[12:07:11 INF] Ensuring bucket exists: party-posters
[12:07:11 INF] Ensuring bucket exists: party-posters
Starting AudioVerse.API
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Bucket ensured: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:11 INF] Setting bucket public: party-posters
[12:07:12 INF] Application starting...
[12:07:12 INF] Ensuring bucket exists: audio-files
[12:07:12 INF] Ensuring bucket exists: audio-files
[12:07:12 INF] Bucket ensured: audio-files
[12:07:12 INF] Bucket ensured: audio-files
[12:07:12 INF] Ensuring bucket exists: karaoke-recordings
[12:07:12 INF] Ensuring bucket exists: karaoke-recordings
[12:07:12 INF] Bucket ensured: karaoke-recordings
[12:07:12 INF] Bucket ensured: karaoke-recordings
[12:07:12 INF] Ensuring bucket exists: party-posters
[12:07:12 INF] Ensuring bucket exists: party-posters
[12:07:12 INF] Bucket ensured: party-posters
[12:07:12 INF] Bucket ensured: party-posters
[12:07:12 INF] Setting bucket public: party-posters
[12:07:12 INF] Setting bucket public: party-posters
[12:07:12 INF] HTTP GET /api/editor/export/1/status responded 200 in 15.1268 ms
[12:07:12 INF] HTTP GET /api/editor/export/1/status responded 200 in 15.1268 ms
[12:07:12 INF] Application started
[12:07:12 INF] Application started
Starting AudioVerse.API
[12:07:12 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:12 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:12 INF] HTTP POST /api/user/notifications responded 201 in 16.3745 ms
[12:07:12 INF] HTTP POST /api/user/notifications responded 201 in 16.3745 ms
[12:07:12 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 20.2228 ms
[12:07:12 INF] HTTP GET /api/user/notifications/unread-count responded 200 in 20.2228 ms
[12:07:12 INF] Application starting...
[12:07:12 INF] Ensuring bucket exists: audio-files
[12:07:12 INF] Ensuring bucket exists: audio-files
[12:07:12 INF] Bucket ensured: audio-files
[12:07:12 INF] Bucket ensured: audio-files
[12:07:12 INF] Ensuring bucket exists: karaoke-recordings
[12:07:12 INF] Ensuring bucket exists: karaoke-recordings
[12:07:12 INF] Bucket ensured: karaoke-recordings
[12:07:12 INF] Bucket ensured: karaoke-recordings
[12:07:12 INF] Ensuring bucket exists: party-posters
[12:07:12 INF] Ensuring bucket exists: party-posters
[12:07:12 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:12 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:12 INF] Bucket ensured: party-posters
[12:07:12 INF] Bucket ensured: party-posters
[12:07:12 INF] Setting bucket public: party-posters
[12:07:12 INF] Setting bucket public: party-posters
[12:07:12 INF] HTTP POST /api/user/notifications/1/read responded 200 in 24.5135 ms
[12:07:12 INF] HTTP POST /api/user/notifications/1/read responded 200 in 24.5135 ms
[12:07:12 INF] HTTP GET /api/user/notifications responded 200 in 14.4459 ms
[12:07:12 INF] HTTP GET /api/user/notifications responded 200 in 14.4459 ms
[12:07:12 INF] HTTP DELETE /api/user/notifications/1 responded 204 in 9.8633 ms
[12:07:12 INF] HTTP DELETE /api/user/notifications/1 responded 204 in 9.8633 ms
[12:07:12 INF] HTTP DELETE /api/user/notifications/1 responded 404 in 7.7125 ms
[12:07:12 INF] HTTP DELETE /api/user/notifications/1 responded 404 in 7.7125 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1 responded 404 in 0.7217 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1 responded 404 in 0.7217 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 105.8234 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 105.8234 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 103.8299 ms
[12:07:12 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 103.8299 ms
[12:07:12 INF] Start processing HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[12:07:12 INF] Start processing HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[12:07:12 INF] Sending HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[12:07:12 INF] Sending HTTP request GET https://maps.googleapis.com/maps/api/timezone/json?*
[12:07:12 INF] HTTP GET /api/playlists responded 200 in 78.4069 ms
[12:07:12 INF] HTTP GET /api/playlists responded 200 in 78.4069 ms
[12:07:13 INF] HTTP DELETE /api/user/connections/nonexistent-platform responded 400 in 9.0463 ms
[12:07:13 INF] HTTP DELETE /api/user/connections/nonexistent-platform responded 400 in 9.0463 ms
[12:07:13 INF] HTTP GET /api/genres responded 200 in 21.3741 ms
[12:07:13 INF] HTTP GET /api/genres responded 200 in 21.3741 ms
[12:07:13 INF] HTTP GET /api/dance/styles responded 404 in 14.1687 ms
[12:07:13 INF] HTTP GET /api/dance/styles responded 404 in 14.1687 ms
[12:07:13 INF] Application started
[12:07:13 INF] Application started
Starting AudioVerse.API
[12:07:13 INF] Start processing HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[12:07:13 INF] Start processing HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[12:07:13 INF] Sending HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[12:07:13 INF] Sending HTTP request GET https://boardgamegeek.com/xmlapi2/collection?*
[12:07:13 INF] HTTP GET /api/media/books responded 200 in 152.8478 ms
[12:07:13 INF] HTTP GET /api/media/books responded 200 in 152.8478 ms
[12:07:13 INF] HTTP GET /api/admin/genres/999999 responded 404 in 38.2706 ms
[12:07:13 INF] HTTP GET /api/admin/genres/999999 responded 404 in 38.2706 ms
[12:07:13 INF] Received HTTP response headers after 252.7008ms - 200
[12:07:13 INF] Received HTTP response headers after 252.7008ms - 200
[12:07:13 INF] End processing HTTP request after 259.9229ms - 200
[12:07:13 INF] End processing HTTP request after 259.9229ms - 200
[12:07:13 INF] HTTP GET /api/admin/genres responded 200 in 19.6263 ms
[12:07:13 INF] HTTP GET /api/admin/genres responded 200 in 19.6263 ms
[12:07:13 INF] Application starting...
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] HTTP GET /api/audio-editor/projects responded 401 in 0.1986 ms
[12:07:13 INF] HTTP GET /api/audio-editor/projects responded 401 in 0.1986 ms
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[xUnit.net 00:00:14.15]     AudioVerse.Tests.Integration.AudioEditorIntegrationTests.GetProjects_Unauthenticated_ReturnsOk [FAIL]
[xUnit.net 00:00:14.15]       Assert.Equal() Failure: Values differ
[xUnit.net 00:00:14.15]       Expected: OK
[xUnit.net 00:00:14.15]       Actual:   Unauthorized
[xUnit.net 00:00:14.15]       Stack Trace:
[xUnit.net 00:00:14.15]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\AudioEditorIntegrationTests.cs(39,0): at AudioVerse.Tests.Integration.AudioEditorIntegrationTests.GetProjects_Unauthenticated_ReturnsOk()
[xUnit.net 00:00:14.15]         --- End of stack trace from previous location ---
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 INF] HTTP GET /api/library/files/audio responded 401 in 0.1627 ms
[12:07:13 INF] HTTP GET /api/library/files/audio responded 401 in 0.1627 ms
[12:07:13 INF] HTTP PUT /api/audio-editor/projects/99999 responded 404 in 37.9423 ms
[12:07:13 INF] HTTP PUT /api/audio-editor/projects/99999 responded 404 in 37.9423 ms
[12:07:13 INF] HTTP POST /api/admin/genres responded 201 in 62.2202 ms
[12:07:13 INF] HTTP POST /api/admin/genres responded 201 in 62.2202 ms
[12:07:13 INF] HTTP GET /api/admin/genres/1 responded 200 in 4.8776 ms
[12:07:13 INF] HTTP GET /api/admin/genres/1 responded 200 in 4.8776 ms
[12:07:13 INF] HTTP POST /api/events/locations responded 201 in 465.1674 ms
[12:07:13 INF] HTTP POST /api/events/locations responded 201 in 465.1674 ms
[12:07:13 INF] HTTP POST /api/media/books responded 201 in 236.9351 ms
[12:07:13 INF] HTTP POST /api/media/books responded 201 in 236.9351 ms
[12:07:13 INF] HTTP DELETE /api/audio-editor/projects/99999/tracks/99999 responded 404 in 64.8277 ms
[12:07:13 INF] HTTP DELETE /api/audio-editor/projects/99999/tracks/99999 responded 404 in 64.8277 ms
Starting AudioVerse.API
[12:07:13 INF] HTTP PUT /api/admin/genres/1 responded 200 in 44.8279 ms
[12:07:13 INF] HTTP PUT /api/admin/genres/1 responded 200 in 44.8279 ms
[12:07:13 INF] HTTP POST /api/admin/genres responded 201 in 9.9338 ms
[12:07:13 INF] HTTP POST /api/admin/genres responded 201 in 9.9338 ms
[12:07:13 INF] HTTP GET /api/events/locations responded 200 in 71.1025 ms
[12:07:13 INF] HTTP GET /api/events/locations responded 200 in 71.1025 ms
[12:07:13 INF] HTTP GET /api/library/files/audio responded 200 in 43.7920 ms
[12:07:13 INF] HTTP GET /api/library/files/audio responded 200 in 43.7920 ms
[12:07:13 INF] HTTP GET /api/media/books/1 responded 200 in 76.5806 ms
[12:07:13 INF] HTTP GET /api/media/books/1 responded 200 in 76.5806 ms
[12:07:13 INF] HTTP DELETE /api/admin/genres/2 responded 204 in 18.0445 ms
[12:07:13 INF] HTTP DELETE /api/admin/genres/2 responded 204 in 18.0445 ms
[12:07:13 INF] Application started
[12:07:13 INF] Application started
Starting AudioVerse.API
[12:07:13 INF] HTTP POST /api/audio-editor/projects responded 201 in 49.1558 ms
[12:07:13 INF] HTTP POST /api/audio-editor/projects responded 201 in 49.1558 ms
[12:07:13 INF] HTTP GET /api/media/tv responded 200 in 54.0402 ms
[12:07:13 INF] HTTP GET /api/media/tv responded 200 in 54.0402 ms
[12:07:13 INF] HTTP GET /api/events/locations/99999 responded 404 in 40.2895 ms
[12:07:13 INF] HTTP GET /api/events/locations/99999 responded 404 in 40.2895 ms
[12:07:13 INF] Application started
[12:07:13 INF] Application started
[12:07:13 INF] HTTP GET /api/audio-editor/projects responded 200 in 13.3861 ms
[12:07:13 INF] HTTP GET /api/audio-editor/projects responded 200 in 13.3861 ms
[12:07:13 INF] HTTP GET /api/library/files/audio/1 responded 404 in 25.5868 ms
[12:07:13 INF] HTTP GET /api/library/files/audio/1 responded 404 in 25.5868 ms
Starting AudioVerse.API
[12:07:13 INF] HTTP DELETE /api/library/files/audio/1 responded 404 in 12.1612 ms
[12:07:13 INF] HTTP DELETE /api/library/files/audio/1 responded 404 in 12.1612 ms
[12:07:13 INF] HTTP POST /api/media/movies responded 201 in 51.5288 ms
[12:07:13 INF] HTTP POST /api/media/movies responded 201 in 51.5288 ms
[12:07:13 INF] HTTP GET /api/library/files/audio responded 200 in 2.6156 ms
[12:07:13 INF] HTTP GET /api/library/files/audio responded 200 in 2.6156 ms
[12:07:13 INF] Application started
[12:07:13 INF] Application started
[12:07:13 INF] HTTP GET /api/media/movies/1 responded 200 in 25.2807 ms
[12:07:13 INF] HTTP GET /api/media/movies/1 responded 200 in 25.2807 ms
[12:07:13 INF] HTTP GET /api/audio-editor/projects/99999 responded 404 in 92.3505 ms
[12:07:13 INF] HTTP GET /api/audio-editor/projects/99999 responded 404 in 92.3505 ms
Starting AudioVerse.API
[12:07:13 INF] Application started
[12:07:13 INF] Application started
Starting AudioVerse.API
[12:07:13 INF] HTTP GET /api/media/sports responded 200 in 53.8198 ms
[12:07:13 INF] HTTP GET /api/media/sports responded 200 in 53.8198 ms
[12:07:13 INF] HTTP POST /api/media/sports responded 201 in 55.6936 ms
[12:07:13 INF] HTTP POST /api/media/sports responded 201 in 55.6936 ms
[12:07:13 INF] Application starting...
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Application starting...
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Application starting...
[12:07:13 INF] Application starting...
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Application starting...
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Ensuring bucket exists: audio-files
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Bucket ensured: audio-files
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: karaoke-recordings
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Bucket ensured: karaoke-recordings
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Ensuring bucket exists: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Bucket ensured: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] Setting bucket public: party-posters
[12:07:13 INF] HTTP GET /api/media/sports/1 responded 200 in 72.7212 ms
[12:07:13 INF] HTTP GET /api/media/sports/1 responded 200 in 72.7212 ms
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:13 INF] HTTP DELETE /api/media/movies/99999 responded 404 in 22.4021 ms
[12:07:13 INF] HTTP DELETE /api/media/movies/99999 responded 404 in 22.4021 ms
[12:07:13 INF] HTTP GET /api/media/movies responded 200 in 34.9156 ms
[12:07:13 INF] HTTP GET /api/media/movies responded 200 in 34.9156 ms
[12:07:13 INF] HTTP GET /api/media/movies/99999 responded 404 in 3.8213 ms
[12:07:13 INF] HTTP GET /api/media/movies/99999 responded 404 in 3.8213 ms
[12:07:13 WRN] Failed to send email to user_f2099bdfd43a48a095b416afbc58deba@test.com
System.Net.Sockets.SocketException (11001): No such host is known.
   at System.Net.NameResolutionPal.ProcessResult(SocketError errorCode, GetAddrInfoExContext* context)
   at System.Net.NameResolutionPal.GetAddressInfoExCallback(Int32 error, Int32 bytes, NativeOverlapped* overlapped)
--- End of stack trace from previous location ---
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, CancellationToken cancellationToken)
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, Int32 timeout, CancellationToken cancellationToken)
   at MailKit.MailService.ConnectNetworkAsync(String host, Int32 port, CancellationToken cancellationToken)
   at MailKit.Net.Smtp.SmtpClient.ConnectAsync(String host, Int32 port, SecureSocketOptions options, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Email.SmtpEmailSender.SendAsync(String to, String subject, String body, Boolean html) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Email\SmtpEmailSender.cs:line 33
[12:07:13 WRN] Failed to send email to user_f2099bdfd43a48a095b416afbc58deba@test.com
System.Net.Sockets.SocketException (11001): No such host is known.
   at System.Net.NameResolutionPal.ProcessResult(SocketError errorCode, GetAddrInfoExContext* context)
   at System.Net.NameResolutionPal.GetAddressInfoExCallback(Int32 error, Int32 bytes, NativeOverlapped* overlapped)
--- End of stack trace from previous location ---
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, CancellationToken cancellationToken)
   at MailKit.Net.SocketUtils.ConnectAsync(String host, Int32 port, IPEndPoint localEndPoint, Int32 timeout, CancellationToken cancellationToken)
   at MailKit.MailService.ConnectNetworkAsync(String host, Int32 port, CancellationToken cancellationToken)
   at MailKit.Net.Smtp.SmtpClient.ConnectAsync(String host, Int32 port, SecureSocketOptions options, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Email.SmtpEmailSender.SendAsync(String to, String subject, String body, Boolean html) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Email\SmtpEmailSender.cs:line 33
[12:07:14 INF] HTTP POST /api/user/register responded 200 in 3438.9493 ms
[12:07:14 INF] HTTP POST /api/user/register responded 200 in 3438.9493 ms
[12:07:14 INF] HTTP POST /api/media/tv responded 201 in 118.0853 ms
[12:07:14 INF] HTTP POST /api/media/tv responded 201 in 118.0853 ms
[12:07:14 INF] Received HTTP response headers after 1051.9155ms - 200
[12:07:14 INF] Received HTTP response headers after 1051.9155ms - 200
[12:07:14 INF] End processing HTTP request after 1052.2365ms - 200
[12:07:14 INF] End processing HTTP request after 1052.2365ms - 200
[12:07:14 INF] HTTP GET /api/media/tv/1 responded 200 in 39.6272 ms
[12:07:14 INF] HTTP GET /api/media/tv/1 responded 200 in 39.6272 ms
[12:07:14 INF] Application started
[12:07:14 INF] Application started
Starting AudioVerse.API
[12:07:14 INF] Linked external account: User 1, Platform BoardGameGeek
[12:07:14 INF] Linked external account: User 1, Platform BoardGameGeek
[12:07:14 INF] HTTP POST /api/user/connections/bgg/link responded 200 in 1182.2559 ms
[12:07:14 INF] HTTP POST /api/user/connections/bgg/link responded 200 in 1182.2559 ms
[12:07:14 INF] HTTP POST /api/user/login responded 200 in 168.3633 ms
[12:07:14 INF] HTTP POST /api/user/login responded 200 in 168.3633 ms
[12:07:14 INF] HTTP GET /api/user/connections responded 200 in 47.4970 ms
[12:07:14 INF] HTTP GET /api/user/connections responded 200 in 47.4970 ms
[12:07:14 INF] HTTP GET /api/user/connections/steam/auth-url responded 400 in 3.8812 ms
[12:07:14 INF] HTTP GET /api/user/connections/steam/auth-url responded 400 in 3.8812 ms
[12:07:14 INF] HTTP GET /api/user/connections responded 401 in 0.1466 ms
[12:07:14 INF] HTTP GET /api/user/connections responded 401 in 0.1466 ms
[12:07:14 INF] HTTP GET /api/user/connections/nonexistent-platform responded 400 in 16.9511 ms
[12:07:14 INF] HTTP GET /api/user/connections/nonexistent-platform responded 400 in 16.9511 ms
[12:07:14 INF] Application started
[12:07:14 INF] Application started
[12:07:14 INF] HTTP POST /api/user/refresh-token responded 200 in 72.7372 ms
[12:07:14 INF] HTTP POST /api/user/refresh-token responded 200 in 72.7372 ms
Starting AudioVerse.API
[12:07:14 INF] HTTP POST /api/user/logout responded 200 in 12.6202 ms
[12:07:14 INF] HTTP POST /api/user/logout responded 200 in 12.6202 ms
[12:07:14 INF] HTTP POST /api/user/recaptcha/verify responded 200 in 19.2432 ms
[12:07:14 INF] HTTP POST /api/user/recaptcha/verify responded 200 in 19.2432 ms
[12:07:14 INF] Application started
[12:07:14 INF] Application started
[12:07:14 INF] HTTP GET /api/admin/system-config responded 200 in 82.7221 ms
[12:07:14 INF] HTTP GET /api/admin/system-config responded 200 in 82.7221 ms
Starting AudioVerse.API
[12:07:14 INF] HTTP PUT /api/admin/system-config responded 200 in 43.7225 ms
[12:07:14 INF] HTTP PUT /api/admin/system-config responded 200 in 43.7225 ms
[12:07:14 INF] Application starting...
[12:07:14 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:14 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Application starting...
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] HTTP GET /api/user/audit-logs responded 200 in 123.5878 ms
[12:07:14 INF] HTTP GET /api/user/audit-logs responded 200 in 123.5878 ms
[12:07:14 INF] Application starting...
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Ensuring bucket exists: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Bucket ensured: audio-files
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Bucket ensured: karaoke-recordings
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 INF] Ensuring bucket exists: party-posters
[12:07:14 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:14 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Bucket ensured: party-posters
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] Setting bucket public: party-posters
[12:07:14 INF] HTTP GET /api/user/audit-logs/all responded 200 in 78.7470 ms
[12:07:14 INF] HTTP GET /api/user/audit-logs/all responded 200 in 78.7470 ms
[12:07:14 INF] Application started
[12:07:14 INF] Application started
[12:07:14 INF] HTTP DELETE /api/events/1/photos/99999 responded 404 in 57.4177 ms
[12:07:14 INF] HTTP DELETE /api/events/1/photos/99999 responded 404 in 57.4177 ms
Starting AudioVerse.API
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 89.1813 ms
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 89.1813 ms
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 6.0503 ms
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 6.0503 ms
[12:07:15 INF] HTTP GET /api/events/1/photos responded 200 in 37.7961 ms
[12:07:15 INF] HTTP GET /api/events/1/photos responded 200 in 37.7961 ms
[12:07:15 INF] Application starting...
[12:07:15 INF] Ensuring bucket exists: audio-files
[12:07:15 INF] Ensuring bucket exists: audio-files
[12:07:15 INF] Bucket ensured: audio-files
[12:07:15 INF] Bucket ensured: audio-files
[12:07:15 INF] Ensuring bucket exists: karaoke-recordings
[12:07:15 INF] Ensuring bucket exists: karaoke-recordings
[12:07:15 INF] Bucket ensured: karaoke-recordings
[12:07:15 INF] Bucket ensured: karaoke-recordings
[12:07:15 INF] Ensuring bucket exists: party-posters
[12:07:15 INF] Ensuring bucket exists: party-posters
[12:07:15 INF] Bucket ensured: party-posters
[12:07:15 INF] Bucket ensured: party-posters
[12:07:15 INF] Setting bucket public: party-posters
[12:07:15 INF] Setting bucket public: party-posters
[12:07:15 INF] HTTP GET /api/events/1/bouncer/waiting responded 200 in 96.8935 ms
[12:07:15 INF] HTTP GET /api/events/1/bouncer/waiting responded 200 in 96.8935 ms
[12:07:15 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:15 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:15 INF] HTTP POST /api/events/1/generate-link responded 200 in 32.8115 ms
[12:07:15 INF] HTTP POST /api/events/1/generate-link responded 200 in 32.8115 ms
[12:07:15 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 61.3909 ms
[12:07:15 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 61.3909 ms
[12:07:15 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 6.3688 ms
[12:07:15 INF] HTTP POST /api/karaoke/rounds/1/players responded 201 in 6.3688 ms
[12:07:15 INF] HTTP POST /api/events/1/photos responded 201 in 460.7008 ms
[12:07:15 INF] HTTP POST /api/events/1/photos responded 201 in 460.7008 ms
[12:07:15 INF] HTTP GET /api/events/join/cf7acb7e5695484cb0e5280bd4e1f9a4 responded 200 in 42.9968 ms
[12:07:15 INF] HTTP GET /api/events/join/cf7acb7e5695484cb0e5280bd4e1f9a4 responded 200 in 42.9968 ms
[12:07:15 INF] HTTP PATCH /api/karaoke/events/999999/participants/999999/status responded 404 in 60.7442 ms
[12:07:15 INF] HTTP PATCH /api/karaoke/events/999999/participants/999999/status responded 404 in 60.7442 ms
[12:07:15 INF] HTTP GET /api/admin/dashboard responded 200 in 52.1242 ms
[12:07:15 INF] HTTP GET /api/admin/dashboard responded 200 in 52.1242 ms
[12:07:15 INF] HTTP GET /api/events/join/nonexistenttoken12345 responded 404 in 1.5717 ms
[12:07:15 INF] HTTP GET /api/events/join/nonexistenttoken12345 responded 404 in 1.5717 ms
[12:07:15 INF] HTTP GET /api/events/1/comments responded 200 in 103.6153 ms
[12:07:15 INF] HTTP GET /api/events/1/comments responded 200 in 103.6153 ms
[12:07:15 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 400 in 44.2780 ms
[12:07:15 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 400 in 44.2780 ms
[12:07:15 INF] Application started
[12:07:15 INF] Application started
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 19.4592 ms
[12:07:15 INF] HTTP POST /api/events/1/comments responded 201 in 19.4592 ms
Starting AudioVerse.API
[12:07:15 INF] HTTP GET /api/admin/events responded 200 in 62.3122 ms
[12:07:15 INF] HTTP GET /api/admin/events responded 200 in 62.3122 ms
[12:07:15 INF] Application started
[12:07:15 INF] Application started
[12:07:15 INF] HTTP DELETE /api/events/1/comments/99999 responded 404 in 26.7753 ms
[12:07:15 INF] HTTP DELETE /api/events/1/comments/99999 responded 404 in 26.7753 ms
[12:07:15 INF] Application started
[12:07:15 INF] Application started
Starting AudioVerse.API
[12:07:15 INF] HTTP POST /api/karaoke/teams responded 201 in 193.0797 ms
[12:07:15 INF] HTTP POST /api/karaoke/teams responded 201 in 193.0797 ms
[12:07:15 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 41.2410 ms
[12:07:15 INF] HTTP GET /api/karaoke/events/1/teams responded 200 in 41.2410 ms
Starting AudioVerse.API
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 37.0827 ms
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 37.0827 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams/1/players responded 201 in 76.4314 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams/1/players responded 201 in 76.4314 ms
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 403 in 1.7788 ms
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 403 in 1.7788 ms
[12:07:16 INF] HTTP GET /api/karaoke/teams/1/players responded 200 in 22.5408 ms
[12:07:16 INF] HTTP GET /api/karaoke/teams/1/players responded 200 in 22.5408 ms
[12:07:16 INF] Application starting...
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 10.7849 ms
[12:07:16 INF] HTTP PATCH /api/karaoke/events/1/participants/1/status responded 200 in 10.7849 ms
[12:07:16 INF] Application started
[12:07:16 INF] Application started
[12:07:16 INF] Application starting...
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] HTTP POST /api/karaoke/events/1/queue responded 201 in 59.1687 ms
[12:07:16 INF] HTTP POST /api/karaoke/events/1/queue responded 201 in 59.1687 ms
Starting AudioVerse.API
[12:07:16 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 22.7331 ms
[12:07:16 INF] HTTP GET /api/karaoke/events/1/queue responded 200 in 22.7331 ms
[12:07:16 INF] HTTP POST /api/leagues responded 201 in 249.7633 ms
[12:07:16 INF] HTTP POST /api/leagues responded 201 in 249.7633 ms
[12:07:16 INF] Application starting...
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] HTTP POST /api/karaoke/players/1/favorites/1 responded 200 in 53.5631 ms
[12:07:16 INF] HTTP POST /api/karaoke/players/1/favorites/1 responded 200 in 53.5631 ms
[12:07:16 INF] HTTP GET /api/karaoke/players/1/favorites responded 200 in 56.5709 ms
[12:07:16 INF] HTTP GET /api/karaoke/players/1/favorites responded 200 in 56.5709 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 24.5711 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 24.5711 ms
[12:07:16 INF] HTTP DELETE /api/karaoke/players/1/favorites/1 responded 204 in 71.3264 ms
[12:07:16 INF] HTTP DELETE /api/karaoke/players/1/favorites/1 responded 204 in 71.3264 ms
[12:07:16 INF] HTTP GET /api/leagues/1 responded 200 in 166.2561 ms
[12:07:16 INF] HTTP GET /api/leagues/1 responded 200 in 166.2561 ms
[12:07:16 INF] Application starting...
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] HTTP GET /api/betting/events/1/markets responded 200 in 56.0636 ms
[12:07:16 INF] HTTP GET /api/betting/events/1/markets responded 200 in 56.0636 ms
[12:07:16 INF] HTTP GET /api/leagues responded 200 in 26.9006 ms
[12:07:16 INF] HTTP GET /api/leagues responded 200 in 26.9006 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 161.5402 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 161.5402 ms
[12:07:16 INF] HTTP POST /api/events/1/invites responded 200 in 36.8428 ms
[12:07:16 INF] HTTP POST /api/events/1/invites responded 200 in 36.8428 ms
[12:07:16 INF] Application started
[12:07:16 INF] Application started
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 210.4575 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 210.4575 ms
[12:07:16 INF] HTTP GET /api/betting/users/999/bets responded 200 in 44.6223 ms
[12:07:16 INF] HTTP GET /api/betting/users/999/bets responded 200 in 44.6223 ms
Starting AudioVerse.API
[12:07:16 INF] HTTP GET /api/leagues/99999 responded 404 in 6.5130 ms
[12:07:16 INF] HTTP GET /api/leagues/99999 responded 404 in 6.5130 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 9.1033 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 400 in 9.1033 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 4.7113 ms
[12:07:16 INF] HTTP POST /api/events/1/billing/expenses responded 201 in 4.7113 ms
[12:07:16 INF] HTTP GET /api/organizations responded 200 in 32.2762 ms
[12:07:16 INF] HTTP GET /api/organizations responded 200 in 32.2762 ms
[12:07:16 INF] HTTP GET /api/betting/users/1/bets responded 401 in 0.0983 ms
[12:07:16 INF] HTTP GET /api/betting/users/1/bets responded 401 in 0.0983 ms
[12:07:16 INF] HTTP POST /api/events/1/sessions responded 200 in 59.3195 ms
[12:07:16 INF] HTTP POST /api/events/1/sessions responded 200 in 59.3195 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 58.5042 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 58.5042 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 1.4246 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 1.4246 ms
[12:07:16 INF] HTTP GET /api/betting/users/999/wallet responded 200 in 49.2610 ms
[12:07:16 INF] HTTP GET /api/betting/users/999/wallet responded 200 in 49.2610 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 19.3145 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 19.3145 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 10.3404 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 10.3404 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 1.1857 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 1.1857 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 22.3282 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 22.3282 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 4.1722 ms
[12:07:16 INF] HTTP POST /api/karaoke/teams responded 400 in 4.1722 ms
[12:07:16 INF] HTTP POST /api/organizations responded 201 in 89.0603 ms
[12:07:16 INF] HTTP POST /api/organizations responded 201 in 89.0603 ms
[12:07:16 INF] HTTP GET /api/events/99999/schedule responded 200 in 36.6080 ms
[12:07:16 INF] HTTP GET /api/events/99999/schedule responded 200 in 36.6080 ms
[12:07:16 INF] HTTP GET /etc/passwd/schedule responded 404 in 0.5963 ms
[12:07:16 INF] HTTP GET /etc/passwd/schedule responded 404 in 0.5963 ms
[12:07:16 INF] HTTP GET /api/organizations/1 responded 200 in 53.2735 ms
[12:07:16 INF] HTTP GET /api/organizations/1 responded 200 in 53.2735 ms
[12:07:16 INF] Application started
[12:07:16 INF] Application started
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 13.5803 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 13.5803 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 1.5778 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 1.5778 ms
Starting AudioVerse.API
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 2.6212 ms
[12:07:16 INF] HTTP GET /api/karaoke/search-songs responded 200 in 2.6212 ms
[12:07:16 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMAC)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:16 INF] HTTP GET /api/admin/events responded 403 in 0.2836 ms
[12:07:16 INF] HTTP GET /api/admin/events responded 403 in 0.2836 ms
[12:07:16 INF] HTTP GET /api/admin/skins responded 200 in 83.4324 ms
[12:07:16 INF] HTTP GET /api/admin/skins responded 200 in 83.4324 ms
[12:07:16 INF] HTTP GET /api/admin/dashboard responded 403 in 0.1516 ms
[12:07:16 INF] HTTP GET /api/admin/dashboard responded 403 in 0.1516 ms
[12:07:16 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.1155 ms
[12:07:16 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.1155 ms
[12:07:16 INF] Application starting...
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:16 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMAC)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] Ensuring bucket exists: audio-files
[12:07:16 INF] HTTP GET /api/admin/dashboard responded 401 in 0.1031 ms
[12:07:16 INF] HTTP GET /api/admin/dashboard responded 401 in 0.1031 ms
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Bucket ensured: audio-files
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Bucket ensured: karaoke-recordings
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 INF] Ensuring bucket exists: party-posters
[12:07:16 ERR] HTTP POST /api/events/1/participants responded 500 in 193.8996 ms
[12:07:16 ERR] HTTP POST /api/events/1/participants responded 500 in 193.8996 ms
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Bucket ensured: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[12:07:16 INF] Setting bucket public: party-posters
[xUnit.net 00:00:17.84]     AudioVerse.Tests.Integration.EventsIntegrationTests.AddParticipantToEvent_AsOrganizer_Succeeds [FAIL]
[12:07:16 INF] Application started
[xUnit.net 00:00:17.84]       Assert.Equal() Failure: Values differ
[12:07:16 INF] Application started
[xUnit.net 00:00:17.84]       Expected: OK
[xUnit.net 00:00:17.84]       Actual:   InternalServerError
[xUnit.net 00:00:17.84]       Stack Trace:
[xUnit.net 00:00:17.84]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\EventsIntegrationTests.cs(44,0): at AudioVerse.Tests.Integration.EventsIntegrationTests.AddParticipantToEvent_AsOrganizer_Succeeds()
[xUnit.net 00:00:17.84]         --- End of stack trace from previous location ---
[12:07:16 INF] HTTP GET /api/admin/events responded 401 in 0.1054 ms
[12:07:16 INF] HTTP GET /api/admin/events responded 401 in 0.1054 ms
[12:07:16 INF] HTTP DELETE /api/admin/skins/999999 responded 404 in 29.8070 ms
[12:07:16 INF] HTTP DELETE /api/admin/skins/999999 responded 404 in 29.8070 ms
Starting AudioVerse.API
[12:07:16 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.0859 ms
[12:07:16 INF] HTTP GET /api/karaoke/filter-songs responded 401 in 0.0859 ms
[12:07:17 INF] HTTP GET /api/karaoke/search-songs responded 401 in 0.0825 ms
[12:07:17 INF] HTTP GET /api/karaoke/search-songs responded 401 in 0.0825 ms
[12:07:17 INF] HTTP POST /api/karaoke/teams responded 400 in 1.8150 ms
[12:07:17 INF] HTTP POST /api/karaoke/teams responded 400 in 1.8150 ms
[12:07:17 INF] Application started
[12:07:17 INF] Application started
[12:07:17 INF] HTTP POST /api/admin/skins responded 201 in 65.1268 ms
[12:07:17 INF] HTTP POST /api/admin/skins responded 201 in 65.1268 ms
[12:07:17 INF] Application starting...
[12:07:17 INF] Ensuring bucket exists: audio-files
[12:07:17 INF] Ensuring bucket exists: audio-files
[12:07:17 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:17 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:17 INF] Bucket ensured: audio-files
[12:07:17 INF] Bucket ensured: audio-files
[12:07:17 INF] Ensuring bucket exists: karaoke-recordings
[12:07:17 INF] Ensuring bucket exists: karaoke-recordings
[12:07:17 INF] HTTP GET /api/admin/skins responded 200 in 14.1370 ms
[12:07:17 INF] HTTP GET /api/admin/skins responded 200 in 14.1370 ms
[12:07:17 INF] Bucket ensured: karaoke-recordings
[12:07:17 INF] Bucket ensured: karaoke-recordings
[12:07:17 INF] Ensuring bucket exists: party-posters
[12:07:17 INF] Ensuring bucket exists: party-posters
[12:07:17 INF] Bucket ensured: party-posters
[12:07:17 INF] Bucket ensured: party-posters
[12:07:17 INF] Setting bucket public: party-posters
[12:07:17 INF] Setting bucket public: party-posters
[12:07:17 INF] Application started
[12:07:17 INF] Application started
[12:07:17 INF] Application starting...
[12:07:17 INF] Ensuring bucket exists: audio-files
[12:07:17 INF] Ensuring bucket exists: audio-files
[12:07:17 INF] Bucket ensured: audio-files
[12:07:17 INF] Bucket ensured: audio-files
[12:07:17 INF] Ensuring bucket exists: karaoke-recordings
[12:07:17 INF] Ensuring bucket exists: karaoke-recordings
[12:07:17 INF] Bucket ensured: karaoke-recordings
[12:07:17 INF] Bucket ensured: karaoke-recordings
[12:07:17 INF] Ensuring bucket exists: party-posters
[12:07:17 INF] Ensuring bucket exists: party-posters
[12:07:17 INF] Bucket ensured: party-posters
[12:07:17 INF] Bucket ensured: party-posters
[12:07:17 INF] Setting bucket public: party-posters
[12:07:17 INF] Setting bucket public: party-posters
[12:07:17 INF] HTTP POST /api/library/external/import responded 200 in 183.5612 ms
[12:07:17 INF] HTTP POST /api/library/external/import responded 200 in 183.5612 ms
[12:07:17 INF] HTTP POST /api/library/songs responded 201 in 52.2616 ms
[12:07:17 INF] HTTP POST /api/library/songs responded 201 in 52.2616 ms
[12:07:17 INF] HTTP POST /api/library/songs/2/details responded 200 in 22.7674 ms
[12:07:17 INF] HTTP POST /api/library/songs/2/details responded 200 in 22.7674 ms
[12:07:17 INF] HTTP GET /api/library/songs/2/details responded 200 in 11.9011 ms
[12:07:17 INF] HTTP GET /api/library/songs/2/details responded 200 in 11.9011 ms
[12:07:17 INF] HTTP DELETE /api/library/songs/details/2 responded 204 in 36.9971 ms
[12:07:17 INF] HTTP DELETE /api/library/songs/details/2 responded 204 in 36.9971 ms
[12:07:17 INF] HTTP POST /api/library/files/audio responded 200 in 27.6435 ms
[12:07:17 INF] HTTP POST /api/library/files/audio responded 200 in 27.6435 ms
[12:07:17 INF] HTTP GET /api/library/files/audio responded 200 in 13.9395 ms
[12:07:17 INF] HTTP GET /api/library/files/audio responded 200 in 13.9395 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 53.9389 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 53.9389 ms
[12:07:17 INF] HTTP POST /api/library/albums responded 201 in 30.9643 ms
[12:07:17 INF] HTTP POST /api/library/albums responded 201 in 30.9643 ms
[12:07:17 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:17 WRN] You do not have a valid license key for the Lucky Penny software MediatR. This is allowed for development and testing scenarios. If you are running in production you are required to have a licensed version. Please visit https://luckypennysoftware.com to obtain a valid license.
[12:07:17 INF] HTTP POST /api/events/1/sessions responded 403 in 23.7009 ms
[12:07:17 INF] HTTP POST /api/events/1/sessions responded 403 in 23.7009 ms
[12:07:17 INF] HTTP POST /api/library/albums/1/artists responded 200 in 31.2517 ms
[12:07:17 INF] HTTP POST /api/library/albums/1/artists responded 200 in 31.2517 ms
[12:07:17 INF] HTTP POST /api/events/1/invites responded 403 in 6.7550 ms
[12:07:17 INF] HTTP POST /api/events/1/invites responded 403 in 6.7550 ms
[12:07:17 INF] HTTP PUT /api/moderation/admin/report/999999/resolve responded 404 in 26.3797 ms
[12:07:17 INF] HTTP PUT /api/moderation/admin/report/999999/resolve responded 404 in 26.3797 ms
[12:07:17 INF] HTTP POST /api/events/1/participants responded 403 in 11.9242 ms
[12:07:17 INF] HTTP POST /api/events/1/participants responded 403 in 11.9242 ms
[12:07:17 INF] Application started
[12:07:17 INF] Application started
[12:07:17 INF] HTTP GET /api/library/albums/1 responded 200 in 92.2938 ms
[12:07:17 INF] HTTP GET /api/library/albums/1 responded 200 in 92.2938 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 3.2248 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 3.2248 ms
[12:07:17 INF] HTTP POST /api/ai/audio/transcribe responded 401 in 0.1243 ms
[12:07:17 INF] HTTP POST /api/ai/audio/transcribe responded 401 in 0.1243 ms
[12:07:17 INF] Abuse report created: 1, TargetType: 
[12:07:17 INF] Abuse report created: 1, TargetType: 
[12:07:17 INF] HTTP POST /api/moderation/report responded 200 in 38.0280 ms
[12:07:17 INF] HTTP POST /api/moderation/report responded 200 in 38.0280 ms
[12:07:17 INF] HTTP POST /api/library/albums responded 201 in 2.8751 ms
[12:07:17 INF] HTTP POST /api/library/albums responded 201 in 2.8751 ms
[12:07:17 INF] HTTP POST /api/library/songs responded 201 in 4.5622 ms
[12:07:17 INF] HTTP POST /api/library/songs responded 201 in 4.5622 ms
[12:07:17 INF] HTTP POST /api/ai/video/pose responded 400 in 20.4767 ms
[12:07:17 INF] HTTP POST /api/ai/video/pose responded 400 in 20.4767 ms
[12:07:17 INF] HTTP GET /api/moderation/admin/reports responded 200 in 23.6980 ms
[12:07:17 INF] HTTP GET /api/moderation/admin/reports responded 200 in 23.6980 ms
[12:07:17 INF] Application started
[12:07:17 INF] Application started
[12:07:17 INF] HTTP GET /api/library/songs/3 responded 200 in 32.4450 ms
[12:07:17 INF] HTTP GET /api/library/songs/3 responded 200 in 32.4450 ms
[12:07:17 INF] HTTP POST /api/ai/audio/transcribe responded 400 in 5.6391 ms
[12:07:17 INF] HTTP POST /api/ai/audio/transcribe responded 400 in 5.6391 ms
[12:07:17 INF] Application started
[12:07:17 INF] Application started
[12:07:17 INF] HTTP GET /api/library/songs responded 200 in 30.8440 ms
[12:07:17 INF] HTTP GET /api/library/songs responded 200 in 30.8440 ms
[12:07:17 INF] HTTP DELETE /api/library/songs/3 responded 204 in 14.6738 ms
[12:07:17 INF] HTTP DELETE /api/library/songs/3 responded 204 in 14.6738 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 3.1268 ms
[12:07:17 INF] HTTP POST /api/library/artists responded 201 in 3.1268 ms
[12:07:17 INF] HTTP PUT /api/library/artists/4 responded 200 in 17.2099 ms
[12:07:17 INF] HTTP PUT /api/library/artists/4 responded 200 in 17.2099 ms
[12:07:17 INF] HTTP GET /api/library/artists/4 responded 200 in 30.0681 ms
[12:07:17 INF] HTTP GET /api/library/artists/4 responded 200 in 30.0681 ms
[12:07:18 INF] HTTP POST /api/library/playlists responded 200 in 12.9695 ms
[12:07:18 INF] HTTP POST /api/library/playlists responded 200 in 12.9695 ms
[12:07:18 INF] HTTP POST /api/library/albums responded 201 in 2.4317 ms
[12:07:18 INF] HTTP POST /api/library/albums responded 201 in 2.4317 ms
[12:07:18 INF] HTTP PUT /api/library/albums/3 responded 200 in 34.9690 ms
[12:07:18 INF] HTTP PUT /api/library/albums/3 responded 200 in 34.9690 ms
[12:07:18 INF] HTTP DELETE /api/library/albums/3 responded 204 in 10.5145 ms
[12:07:18 INF] HTTP DELETE /api/library/albums/3 responded 204 in 10.5145 ms
[12:07:18 INF] HTTP POST /api/library/files/media responded 200 in 65.3454 ms
[12:07:18 INF] HTTP POST /api/library/files/media responded 200 in 65.3454 ms
[12:07:18 INF] HTTP GET /api/library/files/media responded 200 in 25.4683 ms
[12:07:18 INF] HTTP GET /api/library/files/media responded 200 in 25.4683 ms
[12:07:18 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[12:07:18 INF] Start processing HTTP request GET https://musicbrainz.org/ws/2/recording?*
[12:07:18 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[12:07:18 INF] Sending HTTP request GET https://musicbrainz.org/ws/2/recording?*
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 200 in 58.2757 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk responded 200 in 58.2757 ms
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMC8)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMC8)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 9.9838 ms
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 9.9838 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk-revoke responded 200 in 57.2247 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/permissions/bulk-revoke responded 200 in 57.2247 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 13.4167 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 13.4167 ms
[xUnit.net 00:00:19.15]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Organizer_Can_Delete_Player [FAIL]
[xUnit.net 00:00:19.15]       Assert.True() Failure
[xUnit.net 00:00:19.15]       Expected: True
[xUnit.net 00:00:19.15]       Actual:   False
[xUnit.net 00:00:19.15]       Stack Trace:
[xUnit.net 00:00:19.15]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(46,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Organizer_Can_Delete_Player()
[xUnit.net 00:00:19.15]         --- End of stack trace from previous location ---
[12:07:18 INF] HTTP POST /api/games/board/collections responded 201 in 46.5288 ms
[12:07:18 INF] HTTP POST /api/games/board/collections responded 201 in 46.5288 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 200 in 35.5048 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/1/grant responded 200 in 35.5048 ms
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCB)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCB)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 8.7696 ms
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 8.7696 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 200 in 7.8171 ms
[12:07:18 INF] HTTP POST /api/permissions/events/1/players/1/revoke responded 200 in 7.8171 ms
[12:07:18 INF] Application started
[12:07:18 INF] Application started
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.9046 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 2.9046 ms
[xUnit.net 00:00:19.20]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Admin_Can_Delete_Player [FAIL]
[xUnit.net 00:00:19.20]       Assert.True() Failure
[xUnit.net 00:00:19.20]       Expected: True
[xUnit.net 00:00:19.20]       Actual:   False
[xUnit.net 00:00:19.20]       Stack Trace:
[xUnit.net 00:00:19.20]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(69,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Admin_Can_Delete_Player()
[xUnit.net 00:00:19.20]         --- End of stack trace from previous location ---
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCF)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCF)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 6.4096 ms
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 6.4096 ms
[12:07:18 INF] Received HTTP response headers after 173.5771ms - 200
[12:07:18 INF] Received HTTP response headers after 173.5771ms - 200
[12:07:18 INF] End processing HTTP request after 173.8633ms - 200
[12:07:18 INF] End processing HTTP request after 173.8633ms - 200
[12:07:18 INF] HTTP GET /api/library/license responded 200 in 189.5148 ms
[12:07:18 INF] HTTP GET /api/library/license responded 200 in 189.5148 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 403 in 3.5324 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 403 in 3.5324 ms
[12:07:18 INF] HTTP GET /api/games/board/collections/1 responded 200 in 43.1765 ms
[12:07:18 INF] HTTP GET /api/games/board/collections/1 responded 200 in 43.1765 ms
[12:07:18 INF] HTTP POST /api/library/artists responded 201 in 2.6603 ms
[12:07:18 INF] HTTP POST /api/library/artists responded 201 in 2.6603 ms
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCJ)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] Unhandled exception: An error occurred while saving the entity changes. See the inner exception for details. (TraceId: 0HNJMN62DDMCJ)
Microsoft.EntityFrameworkCore.DbUpdateException: An error occurred while saving the entity changes. See the inner exception for details.
 ---> Microsoft.Data.Sqlite.SqliteException (0x80004005): SQLite Error 19: 'FOREIGN KEY constraint failed'.
   at Microsoft.Data.Sqlite.SqliteException.ThrowExceptionForRC(Int32 rc, sqlite3 db)
   at Microsoft.Data.Sqlite.SqliteDataReader.NextResult()
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReader(CommandBehavior behavior)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.Data.Sqlite.SqliteCommand.ExecuteDbDataReaderAsync(CommandBehavior behavior, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalCommand.ExecuteReaderAsync(RelationalCommandParameterObject parameterObject, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Microsoft.EntityFrameworkCore.Update.ReaderModificationCommandBatch.ExecuteAsync(IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Update.Internal.BatchExecutor.ExecuteAsync(IEnumerable`1 commandBatches, IRelationalConnection connection, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.Storage.RelationalDatabase.SaveChangesAsync(IList`1 entries, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(IList`1 entriesToSave, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.ChangeTracking.Internal.StateManager.SaveChangesAsync(StateManager stateManager, Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at Microsoft.EntityFrameworkCore.DbContext.SaveChangesAsync(Boolean acceptAllChangesOnSuccess, CancellationToken cancellationToken)
   at AudioVerse.Infrastructure.Repositories.EventRepositoryEF.AddParticipantAsync(EventParticipant participant, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Infrastructure\Repositories\EventRepositoryEF.cs:line 1049
   at AudioVerse.Application.Handlers.Events.AssignParticipantToEventHandler.Handle(AssignParticipantToEventCommand request, CancellationToken cancellationToken) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Handlers\Events\AssignParticipantToEventHandler.cs:line 24
   at AudioVerse.API.Areas.Events.Controllers.EventsController.AddParticipantToEvent(Int32 eventId, AddParticipantRequest request) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Areas\Events\Controllers\EventsController.cs:line 275
   at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.TaskOfIActionResultExecutor.Execute(ActionContext actionContext, IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync()
--- End of stack trace from previous location ---
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|20_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Awaited|17_0(ResourceInvoker invoker, Task task, IDisposable scope)
   at AudioVerse.API.Middleware.ProfanityMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\ProfanityMiddleware.cs:line 56
   at AudioVerse.API.Middleware.UserBanMiddleware.InvokeAsync(HttpContext context) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.API\Middleware\UserBanMiddleware.cs:line 49
   at Microsoft.AspNetCore.OutputCaching.OutputCacheMiddleware.InvokeAwaited(HttpContext httpContext, IReadOnlyList`1 policies)
   at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context)
   at Microsoft.AspNetCore.Diagnostics.ExceptionHandlerMiddlewareImpl.<Invoke>g__Awaited|10_0(ExceptionHandlerMiddlewareImpl middleware, HttpContext context, Task task)
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 5.5574 ms
[12:07:18 ERR] HTTP POST /api/events/1/participants responded 500 in 5.5574 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 21.2748 ms
[12:07:18 INF] HTTP DELETE /api/karaoke/events/1/participants/1 responded 404 in 21.2748 ms
[xUnit.net 00:00:19.26]     AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Owner_Can_Delete_Their_Player [FAIL]
[12:07:18 INF] Application started
[12:07:18 INF] Application started
[xUnit.net 00:00:19.26]       Assert.True() Failure
[xUnit.net 00:00:19.26]       Expected: True
[xUnit.net 00:00:19.26]       Actual:   False
[xUnit.net 00:00:19.26]       Stack Trace:
[xUnit.net 00:00:19.26]         C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Tests\Integration\DeletePlayerFromEventIntegrationTests.cs(92,0): at AudioVerse.Tests.Integration.DeletePlayerFromEventIntegrationTests.Owner_Can_Delete_Their_Player()
[xUnit.net 00:00:19.26]         --- End of stack trace from previous location ---
[12:07:18 INF] HTTP POST /api/library/artists/5/facts responded 200 in 45.6196 ms
[12:07:18 INF] HTTP POST /api/library/artists/5/facts responded 200 in 45.6196 ms
[12:07:18 INF] HTTP GET /api/games/board/collections/owner/1 responded 200 in 40.6595 ms
[12:07:18 INF] HTTP GET /api/games/board/collections/owner/1 responded 200 in 40.6595 ms
[12:07:18 INF] HTTP GET /api/library/artists/5/facts responded 200 in 27.7009 ms
[12:07:18 INF] HTTP PUT /api/games/board/collections/1 responded 200 in 26.5562 ms
[12:07:18 INF] HTTP GET /api/library/artists/5/facts responded 200 in 27.7009 ms
[12:07:18 INF] HTTP PUT /api/games/board/collections/1 responded 200 in 26.5562 ms
[12:07:18 INF] HTTP POST /api/events responded 201 in 35.5007 ms
[12:07:18 INF] HTTP POST /api/events responded 201 in 35.5007 ms
[12:07:18 INF] HTTP DELETE /api/games/board/collections/1 responded 204 in 8.5893 ms
[12:07:18 INF] HTTP DELETE /api/games/board/collections/1 responded 204 in 8.5893 ms
[12:07:18 INF] HTTP GET /api/events/2 responded 200 in 11.5329 ms
[12:07:18 INF] HTTP GET /api/events/2 responded 200 in 11.5329 ms
[12:07:18 INF] HTTP PUT /api/library/artists/5/detail responded 200 in 20.5721 ms
[12:07:18 INF] HTTP PUT /api/library/artists/5/detail responded 200 in 20.5721 ms
[12:07:18 INF] HTTP POST /api/games/video responded 201 in 16.8933 ms
[12:07:18 INF] HTTP POST /api/games/video responded 201 in 16.8933 ms
[12:07:18 WRN] Failed to download 
System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.
   at System.Net.Http.HttpClient.PrepareRequestMessage(HttpRequestMessage request)
   at System.Net.Http.HttpClient.SendAsync(HttpRequestMessage request, HttpCompletionOption completionOption, CancellationToken cancellationToken)
   at AudioVerse.Application.Services.MediaLibrary.DownloadService.DownloadCoreAsync(String url, String fileName, String subFolder, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Services\MediaLibrary\DownloadService.cs:line 31
[12:07:18 WRN] Failed to download 
System.InvalidOperationException: An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.
   at System.Net.Http.HttpClient.PrepareRequestMessage(HttpRequestMessage request)
   at System.Net.Http.HttpClient.SendAsync(HttpRequestMessage request, HttpCompletionOption completionOption, CancellationToken cancellationToken)
   at AudioVerse.Application.Services.MediaLibrary.DownloadService.DownloadCoreAsync(String url, String fileName, String subFolder, CancellationToken ct) in C:\Users\Radko\source\repos\AudioVerse\audioverse-dotnet\AudioVerse.Application\Services\MediaLibrary\DownloadService.cs:line 31
[12:07:18 INF] HTTP POST /api/library/download/audio responded 400 in 10.9787 ms
[12:07:18 INF] HTTP POST /api/library/download/audio responded 400 in 10.9787 ms
[12:07:18 INF] HTTP POST /api/events/2/schedule responded 201 in 12.8365 ms
[12:07:18 INF] HTTP POST /api/events/2/schedule responded 201 in 12.8365 ms
[12:07:18 INF] HTTP POST /api/library/songs responded 201 in 24.4065 ms
[12:07:18 INF] HTTP POST /api/library/songs responded 201 in 24.4065 ms
[12:07:18 INF] HTTP GET /api/events/2/schedule responded 200 in 5.8290 ms
[12:07:18 INF] HTTP GET /api/events/2/schedule responded 200 in 5.8290 ms
[12:07:18 INF] HTTP PUT /api/library/songs/4 responded 200 in 7.3699 ms
[12:07:18 INF] HTTP PUT /api/library/songs/4 responded 200 in 7.3699 ms
[12:07:18 INF] HTTP GET /api/library/songs/4 responded 200 in 1.7645 ms
[12:07:18 INF] HTTP GET /api/library/songs/4 responded 200 in 1.7645 ms
[12:07:18 INF] HTTP DELETE /api/library/songs/4 responded 204 in 2.6699 ms
[12:07:18 INF] HTTP DELETE /api/library/songs/4 responded 204 in 2.6699 ms
[12:07:18 INF] HTTP POST /api/events/2/menu responded 201 in 8.9622 ms
[12:07:18 INF] HTTP POST /api/events/2/menu responded 201 in 8.9622 ms
[12:07:18 INF] HTTP GET /api/library/songs/4 responded 404 in 1.9813 ms
[12:07:18 INF] HTTP GET /api/library/songs/4 responded 404 in 1.9813 ms
[12:07:18 INF] HTTP POST /api/games/video/sessions responded 201 in 49.4650 ms
[12:07:18 INF] HTTP POST /api/games/video/sessions responded 201 in 49.4650 ms
[12:07:18 INF] HTTP GET /api/events/2/menu responded 200 in 7.2440 ms
[12:07:18 INF] HTTP GET /api/events/2/menu responded 200 in 7.2440 ms
[12:07:18 INF] HTTP POST /api/karaoke/ultrastar/convert/lrc responded 200 in 10.7399 ms
[12:07:18 INF] HTTP POST /api/karaoke/ultrastar/convert/lrc responded 200 in 10.7399 ms
[12:07:18 INF] Application started
[12:07:18 INF] Application started
[12:07:18 INF] HTTP POST /api/events/2/photos responded 201 in 20.0037 ms
[12:07:18 INF] HTTP POST /api/events/2/photos responded 201 in 20.0037 ms
[12:07:18 INF] HTTP GET /api/games/video/sessions/event/1 responded 200 in 27.3491 ms
[12:07:18 INF] HTTP GET /api/games/video/sessions/event/1 responded 200 in 27.3491 ms
[12:07:18 INF] HTTP POST /api/events/2/comments responded 201 in 7.2820 ms
[12:07:18 INF] HTTP POST /api/events/2/comments responded 201 in 7.2820 ms
[12:07:18 INF] HTTP GET /api/events/2/comments responded 200 in 7.1823 ms
[12:07:18 INF] HTTP GET /api/events/2/comments responded 200 in 7.1823 ms
[12:07:18 INF] HTTP GET /api/games/video/sessions/1 responded 200 in 18.3372 ms
[12:07:18 INF] HTTP GET /api/games/video/sessions/1 responded 200 in 18.3372 ms
[12:07:18 INF] HTTP POST /api/games/video/sessions/1/players responded 201 in 15.0266 ms
[12:07:18 INF] HTTP POST /api/games/video/sessions/1/players responded 201 in 15.0266 ms
[12:07:18 INF] HTTP GET /api/events responded 200 in 24.1221 ms
[12:07:18 INF] HTTP GET /api/events responded 200 in 24.1221 ms
[12:07:18 INF] HTTP PATCH /api/games/video/session-players/1/score responded 200 in 10.8920 ms
[12:07:18 INF] HTTP PATCH /api/games/video/session-players/1/score responded 200 in 10.8920 ms
[12:07:18 INF] HTTP DELETE /api/games/video/session-players/1 responded 204 in 14.3364 ms
[12:07:18 INF] HTTP DELETE /api/games/video/session-players/1 responded 204 in 14.3364 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions responded 201 in 25.8441 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions responded 201 in 25.8441 ms
[12:07:18 INF] HTTP DELETE /api/games/video/sessions/1 responded 204 in 10.4795 ms
[12:07:18 INF] HTTP DELETE /api/games/video/sessions/1 responded 204 in 10.4795 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 18.0855 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 18.0855 ms
[12:07:18 INF] HTTP POST /api/games/video/collections responded 201 in 25.3875 ms
[12:07:18 INF] HTTP POST /api/games/video/collections responded 201 in 25.3875 ms
[12:07:18 INF] HTTP GET /api/games/video/collections/1 responded 200 in 22.4598 ms
[12:07:18 INF] HTTP GET /api/games/video/collections/1 responded 200 in 22.4598 ms
[12:07:18 INF] HTTP GET /api/games/board/stats/player/1 responded 200 in 43.8166 ms
[12:07:18 INF] HTTP GET /api/games/board/stats/player/1 responded 200 in 43.8166 ms
[12:07:18 INF] Application started
[12:07:18 INF] Application started
[12:07:18 INF] HTTP GET /api/games/video/collections/owner/1 responded 200 in 15.9070 ms
[12:07:18 INF] HTTP GET /api/games/video/collections/owner/1 responded 200 in 15.9070 ms
[12:07:18 INF] HTTP PUT /api/games/video/collections/1 responded 200 in 11.0483 ms
[12:07:18 INF] HTTP PUT /api/games/video/collections/1 responded 200 in 11.0483 ms
[12:07:18 INF] HTTP DELETE /api/games/video/collections/1 responded 204 in 7.2235 ms
[12:07:18 INF] HTTP DELETE /api/games/video/collections/1 responded 204 in 7.2235 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions responded 201 in 6.6313 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions responded 201 in 6.6313 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 5.9269 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/event/1 responded 200 in 5.9269 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/1 responded 200 in 22.7700 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/1 responded 200 in 22.7700 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions/1/rounds responded 201 in 24.3184 ms
[12:07:18 INF] HTTP POST /api/games/board/sessions/1/rounds responded 201 in 24.3184 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/1/rounds responded 200 in 21.0126 ms
[12:07:18 INF] HTTP GET /api/games/board/sessions/1/rounds responded 200 in 21.0126 ms
[12:07:18 INF] HTTP POST /api/games/board/rounds/1/parts responded 201 in 21.5826 ms
[12:07:18 INF] HTTP POST /api/games/board/rounds/1/parts responded 201 in 21.5826 ms
[12:07:18 INF] HTTP POST /api/games/board/parts/1/players responded 201 in 14.7488 ms
[12:07:18 INF] HTTP POST /api/games/board/parts/1/players responded 201 in 14.7488 ms
[12:07:18 INF] HTTP PATCH /api/games/board/part-players/1/score responded 200 in 11.3776 ms
[12:07:18 INF] HTTP PATCH /api/games/board/part-players/1/score responded 200 in 11.3776 ms
[12:07:18 INF] HTTP DELETE /api/games/board/part-players/1 responded 204 in 7.1974 ms
[12:07:18 INF] HTTP DELETE /api/games/board/part-players/1 responded 204 in 7.1974 ms
[12:07:18 INF] HTTP DELETE /api/games/board/parts/1 responded 204 in 11.2329 ms
[12:07:18 INF] HTTP DELETE /api/games/board/parts/1 responded 204 in 11.2329 ms
[12:07:18 INF] HTTP DELETE /api/games/board/rounds/1 responded 204 in 10.9212 ms
[12:07:18 INF] HTTP DELETE /api/games/board/rounds/1 responded 204 in 10.9212 ms
[12:07:18 INF] HTTP DELETE /api/games/board/sessions/1 responded 204 in 9.3445 ms
[12:07:18 INF] HTTP DELETE /api/games/board/sessions/1 responded 204 in 9.3445 ms
[12:07:18 INF] Application started
[12:07:18 INF] Application started
[xUnit.net 00:00:19.77]   Finished:    AudioVerse.Tests
========== Test run finished: 412 Tests (398 Passed, 14 Failed, 0 Skipped) run in 19.8 sec ==========