using BundleTransformer.Core.Transformers;
using System.Collections.Generic;
using System.Web.Optimization;

/// <summary>
/// BundleConfig 的摘要描述
/// </summary>
public class OrderedScriptBundle : ScriptBundle
{
    public OrderedScriptBundle(string virtualPath) : this(virtualPath, null)
    {
    }

    public OrderedScriptBundle(string virtualPath, string cdnPath) : base(virtualPath, cdnPath)
    {
        Orderer = new AsIsBundleOrderer();
    }
}

public class OrderedStyleBundle : StyleBundle
{
    public OrderedStyleBundle(string virtualPath) : this(virtualPath, null)
    {
    }

    public OrderedStyleBundle(string virtualPath, string cdnPath) : base(virtualPath, cdnPath)
    {
        Orderer = new AsIsBundleOrderer();
        Transforms.Add(new StyleTransformer()); //修正CSS檔裡的URL錯誤問題
        Transforms.Add(new CssMinify());        //CSS 壓縮
    }
}

internal class AsIsBundleOrderer : IBundleOrderer
{
    public virtual IEnumerable<BundleFile> OrderFiles(BundleContext context, IEnumerable<BundleFile> files)
    {
        return files;
    }
}

public class BundleConfig
{
    public static void RegisterBundles(BundleCollection bundles)
    {
      
        ez.data.framesets framesets = new ez.data.framesets();
        framesets.Load();
        ez.web.pages.MasterBase masterBase = new ez.web.pages.MasterBase();

        ez.function f = new ez.function();
        ez.data.template template = new ez.data.template();
        template.Load();
        string themeDemo = template.Data.WebTemplate.Split('/')[2];

        // bundling styles.
        var styleBundle = new OrderedStyleBundle("~/bundles/eZHeadPageRes/styles")
                .Include("~/js/bootstrap-5.1.3-dist/css/bootstrap.min.css")
                .Include("~/css/base.min.css")
                .Include("~/css/base_rwd.min.css")
                .Include("~/Templates/" + themeDemo + "/css/style.css")
                .Include("~/css/contentbuilder/editor_content.css")
                .Include("~/" + framesets.Config.wrpCssFilePath);

        
        if (masterBase.pageWidth == 0)
        {
            styleBundle.Include("~/Templates/" + themeDemo + "/css/style_rwd.css");
        }
        else
        {
            styleBundle.Include("~/css/noMediaQuery.min.css");
        }
        bundles.Add(styleBundle);

        // bundling script.
        bundles.Add(
            new OrderedScriptBundle("~/bundles/eZHeadPageRes/scripts")
            .Include(
                "~/js/jquery-3.5.1.min.js",
                "~/js/bootstrap-5.1.3-dist/js/bootstrap.bundle.min.js"
            ));

        bundles.Add(
            new OrderedScriptBundle("~/bundles/eZHeadFinal/scripts")
            .Include(
                "~/js/selectivizr-1.0.2/selectivizr-min.js",
                "~/js/html5shiv-3.7.2.min.js",
                "~/js/modernizr-2.6.2-respond-1.1.0.min.js",
                "~/js/fontawesome-free-5.15.1-web/js/all.min.js"
            ));
        
        //打開註解，可不關debug bundle js、css
        //BundleTable.EnableOptimizations = true;
    }
}