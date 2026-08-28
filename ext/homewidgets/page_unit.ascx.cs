using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class ext_homewidgets_page_unit : ez.web.controls.ControlBase
{
    /*_PageNumber 參數, 指定單元頁面流水號 (必填、無預設值 ex:"3,2") */
    private string _PageNumber = "";
    public string PageNumber { get { return _PageNumber; } set { _PageNumber = value; } }

    /*_puNameShow 參數, 設定頁面名稱是否顯示true/false (預設值:false) */
    private bool _puNameShow = false;
    public bool puNameShow { get { return _puNameShow; } set { _puNameShow = value; } }

    /*_puPicShow 參數, 設定頁面圖片是否顯示true/false (預設值:false) */
    private bool _puPicShow = false;
    public bool puPicShow { get { return _puPicShow; } set { _puPicShow = value; } }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            PageUint();
        }
    }

    #region 單元頁面

    protected void PageUint()
    {
        pages pages = new pages();
        seo seo = new seo(pages.dbTableName);
        string[] pageNum = _PageNumber.Split(',');

        for (int i = 0; i < pageNum.Length; i++)
        {
            pages.Load(Int32.Parse(pageNum[i]));

            if (lang.ToLower() == pages.Data.nation.ToLower()) //語系判斷
            {
                seo.Load(Int32.Parse(pageNum[i]));

                puWord.Text = pages.Data.word;
                puName.Text = seo.Data.title;
                puPic.ImageUrl = "//" + Request.Url.Host + ResolveUrl(pages.Dir + pages.Data.pic[0]);
            }
        }

        //顯示判斷
        puNameBox.Visible = _puNameShow;
        puPicBox.Visible = _puPicShow;
    }

    #endregion

}
